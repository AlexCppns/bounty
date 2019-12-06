import loop from './loop';
import { select, append, attr, style, text } from './selection';
import transition from './transition';
import {addFadeAttribute, calcMotionValue } from "./utils";

const DIGITS_COUNT = 10;
const ROTATIONS = 3;

const createDigitRoulette = (svg, fontSize, lineHeight, id) => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const roulette = svg
    ::append('g')
    ::attr('id', `digit-${id}`)
    ::style('filter', `url(#motionFilter-${id})`);

  digits.forEach((el, i) => {
    roulette
      ::append('text')
      ::attr('y', -i * fontSize * lineHeight)
      ::text(el);
  });

  return roulette;
};

const createCharacter = (svg, el, fontSize) =>
  svg
    ::append('g')
    ::append('text')
    ::text(el);

const createFilter = (defs, id) =>
  defs
    ::append('filter')
    ::attr('id', `motionFilter-${id}`)
    ::attr('width', '300%')
    ::attr('x', '-100%')
    ::append('feGaussianBlur')
    ::attr('class', 'blurValues')
    ::attr('in', 'SourceGraphic')
    ::attr('stdDeviation', '0 0');

const createGradient = (defs, id) =>
  defs
    ::append('linearGradient')
    ::attr('id', `gradient-${id}`)
    ::attr('x1', '0%')
    ::attr('y1', '0%')
    ::attr('x2', '0%')
    ::attr('y2', '100%')
    ::append('stop')
    ::attr('offset', '0')
    ::attr('stop-color', 'white')
    ::attr('stop-opacity', '0')
    ::select(`#gradient-${id}`)
    ::append('stop')
    ::attr('offset', '0.2')
    ::attr('stop-color', 'white')
    ::attr('stop-opacity', '1')
    ::select(`#gradient-${id}`)
    ::append('stop')
    ::attr('offset', '0.8')
    ::attr('stop-color', 'white')
    ::attr('stop-opacity', '1')
    ::select(`#gradient-${id}`)
    ::append('stop')
    ::attr('offset', '1')
    ::attr('stop-color', 'white')
    ::attr('stop-opacity', '0');

const createMask = (defs, id) =>
  defs
    ::append('mask')
    ::attr('id', `mask-${id}`)
    ::append('rect')
    ::attr('x', 0)
    ::attr('y', 0)
    ::attr('width', '100%')
    ::attr('height', '100%')
    ::attr('fill', `url(#gradient-${id})`);

const setViewBox = (svg, width, height) => {
  svg::attr('width', width);
  svg::attr('height', height);
  svg::attr('viewBox', `0 0 ${width} ${height}`);
  svg::style('overflow', 'hidden');
};

export default ({
  el,
  value,
  initialValue = null,
  lineHeight = 1.35,
  letterSpacing = 1,
  animationDelay = 100,
  letterAnimationDelay = 100,
  duration = 3000,
  thousandSeparator = ',',
  decimalSeparator = ".",
  fadeNumbers = false
}) => {
  const element = select(el);
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseInt(computedStyle.fontSize, 10);
  const marginBottom = (fontSize * lineHeight - fontSize) / 2 + fontSize / 10;
  const offset = fontSize * lineHeight - marginBottom;
  const salt = Date.now();

  let canvasWidth = 0;
  const canvasHeight = fontSize * lineHeight + marginBottom;

  element.innerHTML = '';
  const root = element::append('svg');
  const svg = root::append('svg')::attr('mask', `url(#mask-${salt})`);
  const defs = root::append('defs');
  createGradient(defs, salt);
  createMask(defs, salt);

  const prepareValues = (value, secondValue) => {
    const values = String(value)
      .replace(/ /g, '\u00a0')
      .split('');

    const digitIndex = String(value).search(/\d/);
    while (secondValue.length > values.length) {
      const char =
        secondValue[secondValue.length - values.length - 1 + digitIndex];
      values.splice(digitIndex, 0, isNaN(parseInt(char, 10)) ? char : '0');
    }
    return values;
  };

  const endFunction = (i) => {
    return i === 0 ? () => {
      element.querySelectorAll('[style*="filter"]').forEach(ele => {
        ele.style.filter = ''
      });
      cancelAnimation();
    } : e => e
  };

  const newTransition = (char, i) => {
    console.log(char);
    console.log(fadeNumbers);
    const height = fontSize * lineHeight;
    const from = char.isDigit ? char.initial * height : 0;
    const to = char.isDigit ? (ROTATIONS * DIGITS_COUNT + char.value) * height : 0;
    return transition({
      from: from,
      to: to,
      duration: duration,
      delay: (digits.length - 1 - i) * letterAnimationDelay + animationDelay,
      step(value, t) {
        if(char.isDigit) {
          char.offset.y = offset + (value % (height * DIGITS_COUNT));

          char.node::attr(
            'transform',
            `translate(${char.offset.x}, ${char.offset.y})`
          );
          char.filter::attr('stdDeviation', `0 ${calcMotionValue(from, to, value)}`);
        }

        if(char.willFade && fadeNumbers){ char.node::attr('opacity', 1 -  t); }
      },
      end: endFunction(i)
    });
  };

  const initialString = String(initialValue || '0');
  const values = prepareValues(String(value), initialString);
  const initial = prepareValues(initialString, String(value));

  let chars = values.map((char, i) => {
    const id = `${i}-${salt}`;
    if (isNaN(parseInt(char, 10)) || isNaN(parseInt(initial[i], 10))) {
      return {
        isDigit: false,
        node: createCharacter(svg, char, fontSize),
        value: char,
        offset: { x: 0, y: offset }
      };
    } else {
      return {
        isDigit: true,
        id: id,
        node: createDigitRoulette(svg, fontSize, lineHeight, id),
        filter: createFilter(defs, id),
        value: Number(char),
        initial: Number(initial[i]),
        offset: {
          x: 0,
          y: offset + Number(initial[i]) * (fontSize * lineHeight)
        }
      };
    }
  });

  const transitions = [];
  chars = addFadeAttribute(chars, decimalSeparator, thousandSeparator);
  const digits = chars.filter(char => char.isDigit);

  chars.forEach((char, i) => {
      transitions.push(newTransition(char, i,));
  });

  const update = timestamp => {
    canvasWidth = 0;
    chars.forEach(char => {
      const { width } = char.node.getBBox();

      char.offset.x = canvasWidth;
      // set proper kerning for proportional fonts
      if (char.isDigit) {
        [...char.node.childNodes].forEach(element => {
          const { width: letterWidth } = element.getBBox();
          const offset = (width - letterWidth) / 2;
          element.setAttribute('x', offset);
        });
      }

      canvasWidth += width + letterSpacing;
    });
    canvasWidth -= letterSpacing;

    chars.forEach(char => {
      char.node::attr(
        'transform',
        `translate(${char.offset.x}, ${char.offset.y})`
      );
    });

    setViewBox(root, canvasWidth, canvasHeight);
    transitions.forEach(transition => transition.update(timestamp));
  };

  const cancelAnimation = loop(update);
  return cancelAnimation;
};
