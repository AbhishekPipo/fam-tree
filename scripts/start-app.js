#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONTAINER_NAME = 'janusgraph-default';
const JANUSGRAPH_PORT = 8182;
const MEMORY_OPTS = '-Xms512m -Xmx1024m';

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    const color = colors[level] || colors.reset;
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}`);
}

// Check if Docker is available and running
function checkDocker() {
    return new Promise((resolve, reject) => {
        exec('docker info', (error, stdout, stderr) => {
            if (error) {
                if (error.message.includes('Cannot connect to the Docker daemon')) {
                    log('red', 'Docker daemon is not running');
                    log('blue', 'Starting Docker with Colima...');
                    
                    // Try to start colima
                    exec('colima start', (colimaError) => {
                        if (colimaError) {
                            reject(new Error('Docker is not available and Colima failed to start'));
                        } else {
                            log('green', 'Colima started successfully');
                            setTimeout(() => resolve(), 5000); // Wait for Docker to be ready
                        }
                    });
                } else {
                    reject(new Error(`Docker check failed: ${error.message}`));
                }
            } else {
                log('green', 'Docker is running');
                resolve();
            }
        });
    });
}

// Check if JanusGraph container exists and its status
function checkContainer() {
    return new Promise((resolve) => {
        exec(`docker ps -a --format "{{.Names}};{{.Status}}" | grep "^${CONTAINER_NAME};"`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve({ exists: false, running: false });
            } else {
                const status = stdout.trim().split(';')[1];
                const running = status.includes('Up');
                resolve({ exists: true, running });
            }
        });
    });
}

// Wait for JanusGraph to be ready
function waitForJanusGraph() {
    return new Promise((resolve, reject) => {
        log('blue', 'Waiting for JanusGraph to be ready...');
        let attempts = 0;
        const maxAttempts = 30;
        
        const checkConnection = () => {
            exec(`nc -z localhost ${JANUSGRAPH_PORT}`, (error) => {
                attempts++;
                
                if (!error) {
                    log('green', `JanusGraph is ready on port ${JANUSGRAPH_PORT}`);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('JanusGraph failed to start within 60 seconds'));
                } else {
                    process.stdout.write('.');
                    setTimeout(checkConnection, 2000);
                }
            });
        };
        
        checkConnection();
    });
}

// Start JanusGraph container
async function startJanusGraph() {
    try {
        log('blue', 'Checking JanusGraph status...');
        
        await checkDocker();
        
        const containerStatus = await checkContainer();
        
        if (containerStatus.running) {
            log('green', 'JanusGraph is already running');
            return;
        }
        
        if (containerStatus.exists) {
            log('blue', 'Starting existing JanusGraph container...');
            await new Promise((resolve, reject) => {
                exec(`docker start ${CONTAINER_NAME}`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        } else {
            log('blue', 'Creating new JanusGraph container...');
            await new Promise((resolve, reject) => {
                const cmd = `docker run -d --name ${CONTAINER_NAME} -p ${JANUSGRAPH_PORT}:${JANUSGRAPH_PORT} -e JAVA_OPTIONS="${MEMORY_OPTS}" janusgraph/janusgraph:latest`;
                exec(cmd, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        }
        
        await waitForJanusGraph();
        log('green', `JanusGraph is now running at ws://localhost:${JANUSGRAPH_PORT}/gremlin`);
        
    } catch (error) {
        log('red', `Failed to start JanusGraph: ${error.message}`);
        throw error;
    }
}

// Start the Node.js application
function startNodeApp() {
    return new Promise((resolve, reject) => {
        log('blue', 'Starting Node.js application...');
        
        const serverPath = path.join(__dirname, '..', 'server.js');
        const nodeProcess = spawn('node', [serverPath], {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        nodeProcess.on('error', (error) => {
            log('red', `Failed to start Node.js app: ${error.message}`);
            reject(error);
        });
        
        // Give the server a moment to start
        setTimeout(() => {
            log('green', 'Node.js application started');
            resolve(nodeProcess);
        }, 2000);
    });
}

// Graceful shutdown
function setupGracefulShutdown(nodeProcess) {
    const shutdown = () => {
        log('yellow', 'Shutting down gracefully...');
        
        if (nodeProcess && !nodeProcess.killed) {
            nodeProcess.kill('SIGTERM');
        }
        
        // Optionally stop JanusGraph container (uncomment if desired)
        // exec(`docker stop ${CONTAINER_NAME}`, () => {
        //     log('blue', 'JanusGraph container stopped');
        // });
        
        process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGQUIT', shutdown);
}

// Main startup sequence
async function main() {
    try {
        console.log('\n' + '='.repeat(50));
        log('blue', 'Starting Family Tree Application');
        console.log('='.repeat(50) + '\n');
        
        // Step 1: Start JanusGraph
        await startJanusGraph();
        
        // Step 2: Start Node.js application
        const nodeProcess = await startNodeApp();
        
        // Step 3: Setup graceful shutdown
        setupGracefulShutdown(nodeProcess);
        
        console.log('\n' + '='.repeat(50));
        log('green', 'Application started successfully!');
        log('blue', `API Server: http://localhost:${process.env.PORT || 3000}`);
        log('blue', `JanusGraph: ws://localhost:${JANUSGRAPH_PORT}/gremlin`);
        console.log('='.repeat(50));
        console.log('\nPress Ctrl+C to stop the application\n');
        
    } catch (error) {
        log('red', `Startup failed: ${error.message}`);
        process.exit(1);
    }
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
    case 'janusgraph':
        // Start only JanusGraph
        startJanusGraph().catch(error => {
            log('red', error.message);
            process.exit(1);
        });
        break;
        
    case 'node':
        // Start only Node.js app (assumes JanusGraph is running)
        startNodeApp().then(nodeProcess => {
            setupGracefulShutdown(nodeProcess);
            log('green', 'Node.js application started (JanusGraph should be running separately)');
        }).catch(error => {
            log('red', error.message);
            process.exit(1);
        });
        break;
        
    default:
        // Start both (default behavior)
        main();
        break;
}

module.exports = {
    startJanusGraph,
    startNodeApp,
    checkDocker,
    checkContainer
};