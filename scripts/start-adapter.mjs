import('../server/adapter/serviceAdapter.js').catch((error) => {
  console.error('Failed to start adapter:', error);
  process.exit(1);
});

// Keep process alive
process.stdin.resume();
console.log('[start-adapter] Process is alive and waiting...');
