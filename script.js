let data = null;
let pairs = [];
let index = 0;
let answered = false;
let mistakes = [];
function parseInput(text) {
  const mapA = new Map();
  const mapB = new Map();

  text.split("\n").forEach(line => {
    line = line.replace(/\s+$/, "");
    if (!line || line.startsWith("#")) return;

    const parts = line.split(/\t+/, 2);
    if (parts.length < 2) return;

    const a = parts[0].trim();
    const b = parts[1].trim();

    if (!mapA.has(a)) mapA.set(a, []);
    if (!mapB.has(b)) mapB.set(b, []);

    mapA.get(a).push(b);
    mapB.get(b).push(a);
  });

  return { mapA, mapB };
}

const examples = [
  "kikutan_week1-2.txt",
  "simple_ex.txt"
];

const exampleBox = document.getElementById("exampleButtons");

examples.forEach(name => {
  const btn = document.createElement("button");
  btn.textContent = name;
  btn.onclick = async () => {
    const res = await fetch("examples/" + name);
    const text = await res.text();
    data = parseInput(text);
    alert(`${name} を読み込んだよ`);
  };
  exampleBox.appendChild(btn);
});

document.getElementById("startBtn").onclick = () => {
  if (!data) {
    alert("ファイルを読み込んでね");
    return;
  }
  document.getElementById("result").textContent = "";
  const summaryBox = document.getElementById("summaryBox");
  if (summaryBox) summaryBox.style.display = "none";

  const mode = document.querySelector('input[name="mode"]:checked').value;
  const doShuffle = document.getElementById("shuffle").checked;

  pairs = Array.from(
    mode === "word" ? data.mapB.entries() : data.mapA.entries()
  );

  if (doShuffle) {
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
  }

  index = 0;
  answered = false;
  mistakes = [];

  document.getElementById("answer").disabled = false;
  document.getElementById("submit").disabled = false;

  showQuestion();
};

function showQuestion() {
  if (index >= pairs.length) {
    document.getElementById("question").textContent = "おしまいです";
    document.getElementById("answer").disabled = true;
    document.getElementById("submit").disabled = true;
	showSummary();
    return;
  }

  document.getElementById("question").textContent = pairs[index][0];
  document.getElementById("question").className = "";
  document.getElementById("answer").value = "";
  document.getElementById("result").textContent = "";
  answered = false;
}
function showSummary() {
  const box = document.getElementById("summaryBox");
  const area = document.getElementById("summary");

  box.style.display = "block";
  area.innerHTML = "";

  if (mistakes.length === 0) {
    area.textContent = "ぜんぶ正解です！すごいです！";
    return;
  }

  mistakes.forEach(m => {
    const div = document.createElement("div");
	  div.textContent = `${m.question} → ${m.answers.join(", ")};　誤答: ${m.your}`;
    area.appendChild(div);
  });
}

function judge() {
  if (answered) {
    index++;
    showQuestion();
    return;
  }

  const input = document.getElementById("answer").value.trim().toLowerCase();
  const answers = pairs[index][1];
  const result = document.getElementById("result");

  const normalizedAnswers = answers.map(a => a.toLowerCase());
  if (normalizedAnswers.includes(input)) {
    result.textContent = "CA!";
    result.className = "ac";
  } else {
    result.textContent = "WA… 正解: " + answers.join(", ");
    result.className = "wa";

    mistakes.push({
      question: pairs[index][0],
	  your: input,
      answers: answers
    });
  }


  document.getElementById("question").className = "after";
  answered = true;
}

document.getElementById("submit").onclick = judge;

document.getElementById("answer").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.isComposing) {
    judge();
  }
});

document.getElementById("fileInput").onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    data = parseInput(reader.result);
  };
  reader.readAsText(file);
};
