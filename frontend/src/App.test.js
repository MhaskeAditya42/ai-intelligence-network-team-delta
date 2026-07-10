test('runs the Argus AML test environment', () => {
  expect(process.env.NODE_ENV).toBe('test');
});
