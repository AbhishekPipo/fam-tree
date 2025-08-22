// Utility function to prevent duplicate people
const preventDuplicatePeople = async (personData) => {
  const { phoneNumber, firstName, lastName, dateOfBirth } = personData;
  
  // Check if user already exists with this phone
  if (phoneNumber) {
    const existingUser = await database.runQuery(`
      MATCH (u:User {phone: $phoneNumber})
      RETURN u
    `, { phoneNumber });
    
    if (existingUser.records.length > 0) {
      throw new AppError('A user with this phone number already exists', 409, 'DUPLICATE_USER');
    }
  }
  
  // Check if person exists with similar details
  const existingPerson = await database.runQuery(`
    MATCH (p:Person)
    WHERE p.firstName = $firstName 
    AND p.lastName = $lastName
    AND p.dateOfBirth = $dateOfBirth
    RETURN p
  `, { firstName, lastName, dateOfBirth });
  
  if (existingPerson.records.length > 0) {
    throw new AppError('A person with these details already exists', 409, 'DUPLICATE_PERSON');
  }
};

module.exports = { preventDuplicatePeople };
