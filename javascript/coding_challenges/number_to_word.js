// Converts a positive integer up to one billion to spoken word.
function numberToWord(n, suffix = null) {
  const digits = n.toString().split('').map(Number).reverse();

  if (n >= 1000000) {
    return numberToWord(Math.floor(n / 1000000)) + ' million, ' + numberToWord(n % 1000000);
  } else if (n >= 1000) {
    return numberToWord(Math.floor(n / 1000)) + ' thousand, ' + numberToWord(n % 1000);
  } else if (n >= 100) {
    return onesDigits[digits[2]] + ' hundred ' + numberToWord(n % 100);
  } else if (n >= 20) {
    return tensDigits[digits[1]] + ' ' + numberToWord(n % 10);
  } else if (n >= 1) {
    return onesDigits[n % 100];
  } else {  // n === 0
    return '';
  }
}

const onesDigits = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen'
}

const tensDigits = {
  2: 'twenty',
  3: 'thirty',
  4: 'forty',
  5: 'fifty',
  6: 'sixty',
  7: 'seventy',
  8: 'eighty',
  9: 'ninety'
}

const n = Math.floor(Math.random() * 1000000000);
console.log(n);
console.log(numberToWord(n));