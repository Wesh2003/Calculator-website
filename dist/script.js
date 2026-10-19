"use strict";

const displayValue = document.querySelector("#display-value");
const displayExpression = document.querySelector("#display-expression");
const calculator = document.querySelector(".calculator");
const historyList = document.querySelector("#history-list");
const historyEmpty = document.querySelector("#history-empty");
const themeToggle = document.querySelector("#theme-toggle");
const clearHistoryButton = document.querySelector("#clear-history");
const angleToggle = document.querySelector("#angle-toggle");
const historyStorageKey = "soma-calculator-history";
const themeStorageKey = "soma-calculator-theme";
const angleStorageKey = "soma-calculator-angle-mode";

let currentInput = "0";
let storedValue = null;
let pendingOperator = null;
let waitingForOperand = false;
let justEvaluated = false;
let lastOperator = null;
let lastOperand = null;
let calculationHistory = loadHistory();
let hasError = false;
let angleMode = readStorage(angleStorageKey) === "rad" ? "rad" : "deg";

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The calculator still works when browser storage is unavailable.
  }
}

function loadHistory() {
  try {
    const savedHistory = JSON.parse(readStorage(historyStorageKey) || "[]");
    return Array.isArray(savedHistory) ? savedHistory.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function cleanNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error("That calculation is outside the supported range.");
  }
  const rounded = Number(value.toPrecision(12));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 12,
    useGrouping: true,
  }).format(value);
}

function renderDisplay() {
  if (hasError) {
    displayValue.textContent = currentInput;
    return;
  }
  const formattedValue = formatNumber(Number(currentInput));
  displayValue.textContent = currentInput.endsWith(".") ? `${formattedValue}.` : formattedValue;
}

function renderHistory() {
  historyList.replaceChildren();
  historyEmpty.hidden = calculationHistory.length > 0;

  calculationHistory.forEach((entry) => {
    const item = document.createElement("li");
    const expression = document.createElement("span");
    const result = document.createElement("span");
    item.className = "history-item";
    expression.className = "history-expression";
    result.className = "history-result";
    expression.textContent = entry.expression;
    result.textContent = entry.result;
    item.append(expression, result);
    historyList.append(item);
  });
}

function persistHistory() {
  writeStorage(historyStorageKey, JSON.stringify(calculationHistory));
  renderHistory();
}

function showError(message) {
  currentInput = message;
  storedValue = null;
  pendingOperator = null;
  waitingForOperand = false;
  justEvaluated = false;
  lastOperator = null;
  lastOperand = null;
  hasError = true;
  displayExpression.textContent = "";
  renderDisplay();
}

function clearAll() {
  currentInput = "0";
  storedValue = null;
  pendingOperator = null;
  waitingForOperand = false;
  justEvaluated = false;
  lastOperator = null;
  lastOperand = null;
  hasError = false;
  displayExpression.textContent = "";
  renderDisplay();
}

function enterDigit(digit) {
  if (hasError || justEvaluated) {
    clearAll();
  }
  hasError = false;
  if (waitingForOperand) {
    currentInput = digit;
    waitingForOperand = false;
  } else if (currentInput.replace(/[-.]/g, "").length < 15) {
    currentInput = currentInput === "0" ? digit : currentInput + digit;
  }
  renderDisplay();
}

function enterDecimal() {
  if (hasError || justEvaluated) {
    clearAll();
  }
  if (waitingForOperand) {
    currentInput = "0.";
    waitingForOperand = false;
  } else if (!currentInput.includes(".")) {
    currentInput += ".";
  }
  renderDisplay();
}

function calculate(left, operator, right) {
  switch (operator) {
    case "+": return cleanNumber(left + right);
    case "−": return cleanNumber(left - right);
    case "×": return cleanNumber(left * right);
    case "^": return cleanNumber(left ** right);
    case "÷":
      if (right === 0) {
        throw new Error("Cannot divide by zero.");
      }
      return cleanNumber(left / right);
    default: throw new Error("That operation is not supported.");
  }
}

function chooseOperator(operator) {
  if (hasError) {
    return;
  }
  const inputValue = Number(currentInput);
  if (pendingOperator && !waitingForOperand) {
    try {
      storedValue = calculate(storedValue, pendingOperator, inputValue);
      currentInput = String(storedValue);
    } catch (error) {
      showError(error.message);
      return;
    }
  } else if (storedValue === null || justEvaluated) {
    storedValue = inputValue;
  }
  pendingOperator = operator;
  waitingForOperand = true;
  justEvaluated = false;
  lastOperator = null;
  lastOperand = null;
  displayExpression.textContent = `${formatNumber(storedValue)} ${operator}`;
  renderDisplay();
}

function saveCalculation(expression, result) {
  calculationHistory.unshift({ expression, result, time: Date.now() });
  calculationHistory = calculationHistory.slice(0, 8);
  persistHistory();
}

function pressEquals() {
  if (hasError) {
    return;
  }

  let operator = pendingOperator;
  let left = storedValue;
  let right = Number(currentInput);
  if (!operator && justEvaluated && lastOperator) {
    operator = lastOperator;
    left = Number(currentInput);
    right = lastOperand;
  }
  if (!operator || left === null) {
    return;
  }
  if (waitingForOperand) {
    right = left;
  }

  const expression = `${formatNumber(left)} ${operator} ${formatNumber(right)} =`;
  try {
    const result = calculate(left, operator, right);
    currentInput = String(result);
    displayExpression.textContent = expression;
    lastOperator = operator;
    lastOperand = right;
    storedValue = null;
    pendingOperator = null;
    waitingForOperand = false;
    justEvaluated = true;
    hasError = false;
    renderDisplay();
    saveCalculation(expression, formatNumber(result));
  } catch (error) {
    showError(error.message);
  }
}

function toggleSign() {
  if (hasError) {
    return;
  }
  if (waitingForOperand) {
    currentInput = "-0";
    waitingForOperand = false;
    justEvaluated = false;
    renderDisplay();
    return;
  }
  if (Number(currentInput) !== 0) {
    currentInput = String(-Number(currentInput));
  }
  justEvaluated = false;
  renderDisplay();
}

function applyPercent() {
  if (hasError) {
    return;
  }
  currentInput = String(cleanNumber(Number(currentInput) / 100));
  waitingForOperand = false;
  justEvaluated = false;
  renderDisplay();
}

function applyScientific(name) {
  if (hasError) {
    return;
  }

  const value = Number(currentInput);
  const radians = angleMode === "deg" ? value * Math.PI / 180 : value;
  let result;
  let expression;

  try {
    switch (name) {
      case "sin":
        result = Math.sin(radians);
        expression = `sin(${formatNumber(value)}${angleMode === "deg" ? "°" : " rad"})`;
        break;
      case "cos":
        result = Math.cos(radians);
        expression = `cos(${formatNumber(value)}${angleMode === "deg" ? "°" : " rad"})`;
        break;
      case "tan":
        if (Math.abs(Math.cos(radians)) < 1e-12) {
          throw new Error("Tangent is undefined for this angle.");
        }
        result = Math.tan(radians);
        expression = `tan(${formatNumber(value)}${angleMode === "deg" ? "°" : " rad"})`;
        break;
      case "asin":
      case "acos":
        if (value < -1 || value > 1) {
          throw new Error("Inverse sine and cosine require a value from −1 to 1.");
        }
        result = name === "asin" ? Math.asin(value) : Math.acos(value);
        if (angleMode === "deg") result *= 180 / Math.PI;
        expression = `${name}(${formatNumber(value)})`;
        break;
      case "atan":
        result = Math.atan(value);
        if (angleMode === "deg") result *= 180 / Math.PI;
        expression = `atan(${formatNumber(value)})`;
        break;
      case "ln":
        if (value <= 0) throw new Error("Natural logarithm requires a value greater than zero.");
        result = Math.log(value);
        expression = `ln(${formatNumber(value)})`;
        break;
      case "log":
        if (value <= 0) throw new Error("Logarithm requires a value greater than zero.");
        result = Math.log10(value);
        expression = `log(${formatNumber(value)})`;
        break;
      case "sqrt":
        if (value < 0) throw new Error("Square root requires a non-negative value.");
        result = Math.sqrt(value);
        expression = `√(${formatNumber(value)})`;
        break;
      case "square":
        result = value ** 2;
        expression = `(${formatNumber(value)})²`;
        break;
      case "reciprocal":
        if (value === 0) throw new Error("Cannot divide by zero.");
        result = 1 / value;
        expression = `1 ÷ ${formatNumber(value)}`;
        break;
      case "factorial":
        if (!Number.isInteger(value) || value < 0) {
          throw new Error("Factorial requires a non-negative whole number.");
        }
        if (value > 170) throw new Error("Factorial is supported up to 170.");
        result = 1;
        for (let factor = 2; factor <= value; factor += 1) result *= factor;
        expression = `${formatNumber(value)}!`;
        break;
      default:
        return;
    }

    result = cleanNumber(result);
    currentInput = String(result);
    displayExpression.textContent = `${expression} =`;
    waitingForOperand = false;
    justEvaluated = true;
    lastOperator = null;
    lastOperand = null;
    renderDisplay();
    saveCalculation(`${expression} =`, formatNumber(result));
  } catch (error) {
    showError(error.message);
  }
}

function enterConstant(name) {
  if (hasError || justEvaluated) {
    clearAll();
  }
  currentInput = String(name === "pi" ? Math.PI : Math.E);
  waitingForOperand = false;
  renderDisplay();
}

function deleteDigit() {
  if (hasError || justEvaluated) {
    clearAll();
    return;
  }
  if (waitingForOperand) {
    return;
  }
  currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0";
  if (currentInput === "-") {
    currentInput = "0";
  }
  renderDisplay();
}

function dispatchAction(action, value) {
  if (action === "digit") enterDigit(value);
  if (action === "decimal") enterDecimal();
  if (action === "operator") chooseOperator(value);
  if (action === "equals") pressEquals();
  if (action === "clear") clearAll();
  if (action === "sign") toggleSign();
  if (action === "percent") applyPercent();
  if (action === "delete") deleteDigit();
  if (action === "scientific") applyScientific(value);
  if (action === "constant") enterConstant(value);
}

calculator.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button) {
    dispatchAction(button.dataset.action, button.dataset.value);
  }
});

document.addEventListener("keydown", (event) => {
  if (/^[0-9]$/.test(event.key)) {
    enterDigit(event.key);
  } else if (event.key === ".") {
    enterDecimal();
  } else if (["+", "-", "*", "/", "^"].includes(event.key)) {
    const operators = { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^" };
    chooseOperator(operators[event.key]);
  } else if (event.key === "Enter" || event.key === "=") {
    if (event.key === "Enter" && event.target instanceof Element && event.target.closest("button, a, input, select, textarea")) {
      return;
    }
    event.preventDefault();
    pressEquals();
  } else if (event.key === "Backspace") {
    event.preventDefault();
    deleteDigit();
  } else if (event.key === "Escape") {
    clearAll();
  } else if (event.key === "%") {
    applyPercent();
  }
});

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const darkTheme = theme === "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${darkTheme ? "light" : "dark"} theme`);
  themeToggle.querySelector(".theme-icon").textContent = darkTheme ? "☀" : "☾";
}

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  writeStorage(themeStorageKey, nextTheme);
});

clearHistoryButton.addEventListener("click", () => {
  calculationHistory = [];
  persistHistory();
});

function renderAngleMode() {
  angleToggle.textContent = angleMode.toUpperCase();
  angleToggle.setAttribute("aria-pressed", String(angleMode === "rad"));
  angleToggle.setAttribute("aria-label", `Angle mode: ${angleMode === "deg" ? "degrees" : "radians"}. Switch to ${angleMode === "deg" ? "radians" : "degrees"}`);
}

angleToggle.addEventListener("click", () => {
  angleMode = angleMode === "deg" ? "rad" : "deg";
  writeStorage(angleStorageKey, angleMode);
  renderAngleMode();
});

const savedTheme = readStorage(themeStorageKey);
applyTheme(savedTheme === "dark" ? "dark" : "light");
renderAngleMode();
document.querySelector("#copyright-year").textContent = String(new Date().getFullYear());
renderDisplay();
renderHistory();