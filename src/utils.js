export function findDecimalSeparator(chars, separator){
  let index = -1;
  chars.forEach((char, i) => {
    if (char.value === separator) {
      index = i;
    }
  });
  return index;
}

export function addFadeAttribute(chars, decimalSeparator, thousandSeparator) {
  let isSuperfluousZero = true;

  const dotPosition = findDecimalSeparator(chars, decimalSeparator);
  return chars.map((char, i) => {
    if (isSuperfluousZero === false || (!char.isDigit && char.value !== thousandSeparator)) {
      char.willFade = false;
      return char;
    }

    if (char.isDigit && char.value !== 0) {
      isSuperfluousZero = false;
      char.willFade = false;
    } else if (dotPosition > -1) {
      if (i >= dotPosition - 1) {
        isSuperfluousZero = false;
        char.willFade = false;
      } else {
        char.willFade = true;
      }
    } else {
      char.willFade = true;
    }
    return char;
  });
}

export function calcMotionValue(sourceDistance, targetDistance, value) {
  const filterOrigin = (sourceDistance + targetDistance) / 2;
  return Number(
    Math.abs(
      Math.abs(Math.abs(value - filterOrigin) - filterOrigin) -
      sourceDistance
    ) / 100
  ).toFixed(1);
}
