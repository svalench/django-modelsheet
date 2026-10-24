(() => {
  const examples = {
    markup: { formula: "=[price]*1.07", values: ["1 284.00", "909.50", "3 638.00"] },
    discount: { formula: "=ROUND([price]*0.9,2)", values: ["1 080.00", "765.00", "3 060.00"] },
    round: { formula: "=ROUND([price]/100,0)*100", values: ["1 200.00", "800.00", "3 400.00"] },
  };
  const output = document.querySelector("#demo-expression");
  if (!output) return;
  output.setAttribute("aria-live", "polite");
  document.querySelectorAll("[data-example]").forEach((button) => {
    button.addEventListener("click", () => {
      const example = examples[button.dataset.example];
      output.textContent = example.formula;
      document.querySelectorAll("[data-result]").forEach((cell) => {
        cell.textContent = example.values[Number(cell.dataset.result)];
      });
      document.querySelectorAll("[data-example]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
    });
  });
})();
