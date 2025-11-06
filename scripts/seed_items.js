#!/usr/bin/env node
const path = require("path");
const { init } = require("../src/db");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

(async () => {
  try {
    process.env.DB_FILE = path.join(__dirname, "..", "data", "app.db");
    const db = await init();

    const names = [
      "덧셈의 원리",
      "뺄셈의 이해",
      "곱셈 구구단",
      "나눗셈 기초",
      "분수란 무엇일까",
      "소수의 개념",
      "도형의 종류",
      "길이와 넓이",
      "시계 읽기",
      "그래프 그리기",
      "평균 구하기",
      "비율과 백분율",
      "단위 환산",
      "수의 순서",
      "짝수와 홀수",
      "규칙 찾기",
      "도형의 둘레",
      "각도 측정",
      "삼각형의 성질",
      "사칙연산 복습",
    ];
    const descs = [
      "덧셈은 두 수를 합하는 연산입니다. 예를 들어 2+3=5가 됩니다.",
      "뺄셈은 큰 수에서 작은 수를 빼는 연산입니다. 예: 5-2=3.",
      "구구단은 곱셈을 쉽게 외우기 위한 표입니다. 2x3=6 등.",
      "나눗셈은 수를 여러 부분으로 나누는 연산입니다. 6÷2=3.",
      "분수는 전체를 나눈 부분을 나타냅니다. 1/2은 전체의 절반.",
      "소수는 1보다 작은 수를 나타냅니다. 예: 0.5, 0.25 등.",
      "도형에는 삼각형, 사각형, 원 등이 있습니다.",
      "길이는 물체의 길이를, 넓이는 면의 크기를 나타냅니다.",
      "시계는 시간을 읽는 도구입니다. 시침, 분침을 봅니다.",
      "그래프는 정보를 그림으로 나타내는 방법입니다.",
      "평균은 여러 수의 합을 개수로 나눈 값입니다.",
      "비율은 두 수의 크기를 비교하는 방법입니다. 백분율은 100을 기준으로 나타냅니다.",
      "단위 환산은 cm를 m로 바꾸는 등 단위를 바꾸는 방법입니다.",
      "수의 순서는 크고 작음을 비교하여 정렬하는 것입니다.",
      "짝수는 2로 나누어 떨어지는 수, 홀수는 그렇지 않은 수입니다.",
      "규칙 찾기는 반복되는 패턴을 찾는 것입니다.",
      "도형의 둘레는 외곽선의 길이입니다.",
      "각도는 두 선이 만나는 점에서의 벌어진 정도입니다.",
      "삼각형은 세 변과 세 각을 가진 도형입니다.",
      "사칙연산은 덧셈, 뺄셈, 곱셈, 나눗셈을 모두 복습하는 것입니다.",
    ];

    const countRow = await db.get("SELECT COUNT(*) as cnt FROM items");
    const before = countRow.cnt || 0;
    const target = 80;
    const toInsert = Math.max(0, target - before);

    for (let i = 0; i < toInsert; i++) {
      const name = pick(names) + " #" + randInt(1, 999);
      const description = pick(descs);
      const stair = i < target / 2 ? 2 : 3;
      // img1: /img/items/item01.jpg ~ /img/items/item40.jpg, cycling
      const imgNum = ((i % 40) + 1).toString().padStart(2, "0");
      const img1 = `/img/items/item${imgNum}.jpg`;
      await db.run(
        "INSERT INTO items (name, description, stair, img1) VALUES (?, ?, ?, ?)",
        [name, description, stair, img1]
      );
    }

    const afterRow = await db.get("SELECT COUNT(*) as cnt FROM items");
    const after = afterRow.cnt || 0;
    console.log(
      `Seeded items: before=${before}, inserted=${toInsert}, after=${after}`
    );

    await db.close();
  } catch (err) {
    console.error("Seeding items failed:", err);
    process.exit(1);
  }
})();
