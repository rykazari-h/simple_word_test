let data = null;
let pairs = [];
let index = 0;
let answered = false;
let mistakes = [];
let slots = [];
const examples = [
	"simple_ex.txt",
	"古文単語読解必修語50.txt",
	"古文単語入試必修動詞23.txt",
	"古文単語入試必修形容詞25.txt",
	"古文単語入試必修形容動詞9.txt",
	"古文単語入試必修名詞18.txt",
	"古文単語入試必修副詞19.txt",
	"古文単語入試必修連語6.txt",
	"kikutan_week1.txt",
	"kikutan_week2.txt",
	"kikutan_week3.txt",
	"kikutan_week4.txt",
	"kikutan_week5.txt",
	"kikutan_week6.txt",
	"kikutan_week7.txt",
	"kikutan_week8.txt"
];
const fileCells = document.getElementById("fileCells");
const addCellBtn = document.getElementById("addCell");
const removeCellBtn = document.getElementById("removeCell");
const exampleBox = document.getElementById("exampleButtons");
const exampleSelect = document.getElementById("exampleSelect");
const importExampleBtn = document.getElementById("importExampleBtn");
function parseInput(text) {
	const mapA = new Map();
	const mapB = new Map();

	text.split("\n").forEach(line => {
		line = line.replace(/\s+$/, "");
		if (!line || line.startsWith("#")) return;

		const parts = line.split(/\t+/, 2);
		if (parts.length < 2) return;

		const a = parts[0].trim().replace(/\\n/g, "\n");
		const b = parts[1].trim().replace(/\\n/g, "\n");

		if (!mapA.has(a)) mapA.set(a, []);
		if (!mapB.has(b)) mapB.set(b, []);

		mapA.get(a).push(b);
		mapB.get(b).push(a);
	});

	return { mapA, mapB };
}

document.getElementById("startBtn").onclick = async () => {
	const text = await loadSlots();
	if (text === "") {
		alert("ファイルを読み込んでね");
		return;
	}
	data = parseInput(text);
	document.getElementById("result").innerText = "";
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
		document.getElementById("question").innerText = "おしまいです";
		document.getElementById("answer").disabled = true;
		document.getElementById("submit").disabled = true;
		showSummary();
		return;
	}

	document.getElementById("question").innerText = pairs[index][0];
	document.getElementById("question").className = "";
	document.getElementById("answer").value = "";
	document.getElementById("result").innerText = "";
	answered = false;
}
function showSummary() {
	const box = document.getElementById("summaryBox");
	const area = document.getElementById("summary");

	box.style.display = "block";
	area.innerHTML = "";

	if (mistakes.length === 0) {
		area.innerText = "ぜんぶ正解です！すごいです！";
		return;
	}

	mistakes.forEach(m => {
		const div = document.createElement("div");
		div.innerText = `${m.question} → ${m.answers.join(", ")};　誤答: ${m.your}`;
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
		result.innerText = "CA! " + answers.join(", ");
		result.className = "ac";
	} else {
		result.innerText = "WA… " + answers.join(", ");
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
function renderSlots() {
	fileCells.innerHTML = "";
	slots.forEach((slot, i) => {
		const div = document.createElement("div");
		div.className ="file-cell";
		div.innerText = slot.name ? slot.name : `(空 ${i + 1})`;
		fileCells.appendChild(div);
	});
}
addCellBtn.onclick = () => {
	slots.push({
		type: null,
		name: ""
	});
	renderSlots();
};
removeCellBtn.onclick = () => {
	if (slots.length === 0) return;
	slots.pop();
	renderSlots();
}
function getLastEmptySlot() {
	if (slots.length == 0) return null;
	for (let i = slots.length - 1; 0 <= i ; i--) {
		if (!slots[i].type) return slots[i];
	}
	return slots[slots.length - 1];
}
function importEx(name) {
	const slot = getLastEmptySlot();
	if(!slot) {
		alert("スロットがないよ");
		return;
	}
	slot.type = "example";
	slot.name = name;
	slot.source = "examples/" + name;
	renderSlots();
}
document.getElementById("fileInput").onchange = e => {
	const file = e.target.files[0];
	if (!file) return;

	const slot = getLastEmptySlot();
	if (!slot) {
		alert("スロットがないよ");
		return;
	}
	slot.type = "local";
	slot.name = file.name;
	slot.file = file;
	renderSlots();
	e.target.value = "";
};
async function loadSlots() {
	let texts = [];
	for (const slot of slots) {
		if (!slot.type) continue;
		if (slot.type === "example") {
			const res = await fetch(slot.source);
			texts.push(await res.text());
		} else if (slot.type === "local") {
			texts.push(await slot.file.text());
		}
	}
	return texts.join("\n");
}
examples.forEach(name => {
	const opt = document.createElement("option");
	opt.value = name;
	opt.innerText = name.startsWith(".") ? name : name.replace(/\.[^.]+$/, "");
	exampleSelect.appendChild(opt);
});

importExampleBtn.onclick = () => {
	const name = exampleSelect.value;
	if (!name) return;
	importEx(name);
	exampleSelect.value = "";
};
