async function runTests() {
  console.log('--- TEST 1: JavaScript Syntax Error ---');
  const payload1 = {
    code: 'console.log("Hello World"\n// SyntaxError: missing ) after argument list',
    language: 'javascript',
    isPrivate: false
  };

  const res1 = await fetch('http://localhost:3000/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload1)
  });
  const data1 = await res1.json();
  console.log(JSON.stringify(data1, null, 2));

  console.log('\n--- TEST 2: Python Missing Argument ---');
  const payload2 = {
    code: 'def calculate_total(price, quantity):\n    return price * quantity\n\ntotal = calculate_total(100)\nprint(total)',
    language: 'python',
    isPrivate: false
  };

  const res2 = await fetch('http://localhost:3000/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload2)
  });
  const data2 = await res2.json();
  console.log(JSON.stringify(data2, null, 2));
}

runTests().catch(console.error);
