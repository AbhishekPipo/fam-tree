document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
  }

  const width = document.getElementById('tree').clientWidth;
  const height = document.getElementById('tree').clientHeight;

  const svg = d3.select('#tree').append('svg')
    .attr('width', width)
    .attr('height', height)
    .call(d3.zoom().on('zoom', function (event) {
      svg.attr('transform', event.transform)
    }))
    .append('g');

  const simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2));

  const fetchData = async () => {
    try {
      const response = await fetch('/api/family/tree', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      render(data);
    } catch (error) {
      console.error('Error fetching family tree:', error);
    }
  };

  const render = (graph) => {
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graph.links)
      .enter().append('line')
      .attr('class', 'link');

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graph.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', 10);

    node.append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.name);

    simulation
      .nodes(graph.nodes)
      .on('tick', ticked);

    simulation.force('link')
      .links(graph.links);

    function ticked() {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    }
  };

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  fetchData();
});
