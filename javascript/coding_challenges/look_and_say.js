// Implements of look-and-say sequence generator.
function lookAndSay(arr) {
  const ret = [];
  let count = 1;
  let value = arr.shift();
  for (let entry of arr) {
    if (entry === value) {
      count++;
    } else {
      ret.push(count, value);
      value = entry;
      count = 1;
    }
  }
  ret.push(count, value);
  return ret;
}

let seq = [1];
console.log(seq.join(''));
for (let i = 0; i < 15; i++) {
  seq = lookAndSay(seq);
  console.log(seq.join(''));
}