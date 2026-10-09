"use strict";

const displayValue = document.querySelector("#display-value");
const displayExpression = document.querySelector("#display-expression");
const keypad = document.querySelector(".keypad");
const historyList = document.querySelector("#history-list");
const historyEmpty = document.querySelector("#history-empty");
const themeToggle = document.querySelector("#theme-toggle");
const clearHistoryButton = document.querySelector("#clear-history");
const historyStorageKey = "soma-calculator-history";
const themeStorageKey = "soma-calculator-theme";

let currentInput = "0";
let storedValue = null;
let pendingOperator = null;
let waitingForOperand = false;
let justEvaluated = false;
let lastOperator = null;
let lastOperand = null;
let calculationHistory = loadHistory();
let hasError = false;

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
}

keypad.addEventListener("click", (event) => {
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
  } else if (["+", "-", "*", "/"].includes(event.key)) {
    const operators = { "+": "+", "-": "−", "*": "×", "/": "÷" };
    chooseOperator(operators[event.key]);
  } else if (event.key === "Enter" || event.key === "=") {
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

const savedTheme = readStorage(themeStorageKey);
applyTheme(savedTheme === "dark" ? "dark" : "light");
document.querySelector("#copyright-year").textContent = String(new Date().getFullYear());
renderDisplay();
renderHistory();