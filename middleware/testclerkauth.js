const mockClerkAuth = (req, res, next) => {
  // Simulating Clerk authentication
  req.auth = { 
      userId: "user_2yY5xpi0yshFceryCdEoS4xW1Lt" // Your test user ID
  };
  console.log('mockClerkAuth set req.auth:', req.auth);
  console.log('mockClerkAuth set req.auth:', req.auth);
  next();
};

export default mockClerkAuth;