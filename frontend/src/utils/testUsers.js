/**
 * Test user credentials for existing users
 * USE ONLY FOR DEVELOPMENT/TESTING - NOT FOR PRODUCTION
 */

export const TEST_USERS = [
  {
    id: 'test-admin-id',
    name: "Test Admin",
    email: "admin@test.com",
    password: "Password123!",
    role: "admin"
  },
  {
    id: 'test-user-id',
    name: "Test User",
    email: "user@test.com", 
    password: "Password123!",
    role: "user"
  },
  {
    id: 'test-manager-id',
    name: "Test Manager",
    email: "manager@test.com",
    password: "Password123!",
    role: "manager"
  }
];

/**
 * Map of test users for direct authentication
 */
export const TEST_USER_MAP = TEST_USERS.reduce((acc, user) => {
  acc[`${user.email}:${user.password}`] = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  return acc;
}, {});

/**
 * Test user creation is disabled
 */
export const createTestUsers = () => {
  console.log('Test user creation is disabled. Using existing users.');
  return Promise.resolve();
};

/**
 * Helper to authenticate with test credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object|null} User object if credentials match, null otherwise
 */
export const authenticateTestUser = (email, password) => {
  const key = `${email}:${password}`;
  return TEST_USER_MAP[key] || null;
};

export default TEST_USERS; 