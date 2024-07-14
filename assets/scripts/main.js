(function () {
  const keyboardDisplay = document.querySelector(".keyboard");
  const wordsDisplay = document.querySelector(".words-display");
  const modeDisplay = document.querySelector("#mode-display");
  const actionButtons = document.querySelectorAll("button[data-action]");
  const modeButtons = document.querySelectorAll("button[data-mode]");

  const config = {
    prevWords: [],
    stopGame: false,
    currentLine: 0,
    currentWord: "",
    maxTry: Infinity,
    chars: {
      delete: "&#8592;",
    },
    keys: [
      ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ", "ძ"],
      ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ", "თ", "ჭ"],
      ["ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ"],
    ],
    keyMap: {
      q: "ქ",
      w: "წ",
      e: "ე",
      r: "რ",
      t: "ტ",
      y: "ყ",
      u: "უ",
      i: "ი",
      o: "ო",
      p: "პ",
      a: "ა",
      s: "ს",
      d: "დ",
      f: "ფ",
      g: "გ",
      h: "ჰ",
      j: "ჯ",
      k: "კ",
      l: "ლ",
      z: "ზ",
      x: "ხ",
      c: "ც",
      v: "ვ",
      b: "ბ",
      n: "ნ",
      m: "მ",
      W: "ჭ",
      T: "თ",
      Z: "ძ",
    },
    words: getWordList(WORLD_LIST),
    colors: {
      success: "rgba(0, 175, 0, 0.5)",
      missed: "rgba(128, 128, 128, 0.5)",
      wrongPlace: "rgba(255, 166, 0, 0.5)",
    },
    mode: {
      easy: {
        try: Infinity,
        text: "მარტივი",
      },
      medium: {
        try: 10,
        text: "საშუალო",
      },
      hard: {
        try: 5,
        text: "რთული",
      },
    },
    storageKeys: {
      guessedWords: "guessed_words",
    },
  };

  document.body.addEventListener("keyup", (event) => {
    const displayedChars = document.querySelectorAll("li.char");
    displayedChars.forEach((charRef) => {
      if (event.key === "Backspace" || event.key === config.chars.delete) {
        const deleteChar = document.querySelector("li.char[data-remove]");
        deleteChar.click();
        return;
      }

      if (
        config.keyMap[event.key] === charRef.textContent ||
        charRef.textContent === event.key
      ) {
        charRef.click();
        return;
      }
    });
  });

  actionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const action = this.getAttribute("data-action");
      switch (action) {
        case "clear": {
          actionClear();
          break;
        }
        case "info": {
          actionInfo();
          break;
        }
        case "start": {
          initGame();
          break;
        }
      }
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const mode = this.getAttribute("data-mode");
      const modeData = config.mode[mode];
      config.maxTry = modeData.try;
      modeDisplay.textContent = modeData.text;
      initGame();
    });
  });

  function displayKeyboard(keys = [[]]) {
    keyboardDisplay.innerHTML = "";
    keys.forEach((chars) => {
      const ul = document.createElement("ul");
      ul.classList.add("line");
      chars.forEach((char) => {
        const li = document.createElement("li");
        li.classList.add("char");
        li.innerHTML = char;
        if (char === config.chars.delete) {
          li.setAttribute("data-remove", "");
        }
        li.addEventListener("click", appendCharToLine);
        li.addEventListener("keydown", (event) => {
          if (event.code === "Enter" || event.code === "Space") {
            appendCharToLine.call(li);
          }
        });
        li.setAttribute("tabindex", "0");
        ul.appendChild(li);
      });
      keyboardDisplay.appendChild(ul);
    });
  }

  function getRandomWord(words = []) {
    return words[Math.floor(Math.random() * words.length)];
  }

  function appendCharToLine() {
    if (config.stopGame) {
      return;
    }

    const char = this.innerHTML;
    const isDeleteChar = this.getAttribute("data-remove") === "";

    if (!char) {
      return;
    }

    if (isDeleteChar) {
      const currentContainer = wordsDisplay.children[config.currentLine];
      let index = 0;
      let emptyNode = currentContainer.children[index];
      while (emptyNode.textContent !== "") {
        index++;
        emptyNode = currentContainer.children[index];
        if (index === currentContainer.children.length - 1) {
          break;
        }
      }
      if (index - 1 === -1) {
        return;
      }
      currentContainer.children[index - 1].textContent = "";
      return;
    }

    const currentContainer = wordsDisplay.children[config.currentLine];
    let index = 0;

    index = 0;
    let emptyNode = currentContainer.children[index];
    while (emptyNode.textContent !== "") {
      index++;
      emptyNode = currentContainer.children[index];
      if (index === currentContainer.children.length - 1) {
        emptyNode.textContent = char;
        checkWin();
        return;
      }
    }
    emptyNode.textContent = char;
  }

  function displayWordSpace(charSize = 0) {
    const ul = document.createElement("ul");
    ul.classList.add("words-container");
    for (let i = 0; i < charSize; i++) {
      const li = document.createElement("li");
      li.classList.add("words-char");
      ul.appendChild(li);
    }
    wordsDisplay.appendChild(ul);
  }

  function checkWin() {
    let typedWord = "";
    const currentContainer = wordsDisplay.children[config.currentLine];
    let index = 0;

    while (currentContainer.children[index]) {
      const currentChar = currentContainer.children[index].textContent;
      typedWord += currentChar;
      index++;
      const currentCharIndexInWord = config.currentWord.search(currentChar);
      const color =
        currentCharIndexInWord === -1
          ? config.colors.missed
          : config.currentWord[index - 1] === currentChar
          ? config.colors.success
          : config.colors.wrongPlace;
      currentContainer.children[index - 1].style.backgroundColor = color;
      document.querySelectorAll("li.char").forEach((charRef) => {
        if (charRef.textContent === currentChar) {
          charRef.style.backgroundColor = color;
          if (color === config.colors.missed) {
            charRef.classList.add("missed");
          }
        }
      });
    }

    if (typedWord === config.currentWord) {
      displayAlert("თქვენ გაიმარჯვეთ", "success");
      config.stopGame = true;
      config.prevWords.push(config.currentWord);
      localStorage.setItem(
        config.storageKeys.guessedWords,
        JSON.stringify(config.prevWords)
      );
    }

    config.currentLine++;
    displayWordSpace(config.currentWord.length);
    setTimeout(() => {
      try {
        wordsDisplay.children[config.currentLine].scrollIntoView();
      } catch (err) {}
    }, 500);
    if (config.maxTry === config.currentLine) {
      displayAlert(
        "თქვენ წაააგეთ",
        "error",
        "",
        `სიტყვა იყო: <span style="font-weight: bold">${config.currentWord}</span>`
      );
      config.stopGame = true;
    }
  }

  function actionInfo() {
    displayAlert(
      "ინფორმაცია რეჟიმების შესახებ",
      "info",
      "",
      `<ul style="list-style: none; padding: 0; margin: 0">
        <li>თითოეული რეჟიმი განსაზღვრავს მცდელობების რაოდენობას.</li>
        <li><span style="color: green">მარტივ</span> რეჟიმში შეიძლება უსასრულოდ ცდა</li>
        <li><span style="color: orange">საშუალო</span> რეჟიმში შეიძლება ${config.mode.medium.try} ცდა</li>
        <li><span style="color: red">რთულ</span> რეჟიმში შეიძლება ${config.mode.hard.try} ცდა</li>
      </ul>
    `
    );
  }

  function actionClear() {
    wordsDisplay.innerHTML = "";
    config.currentLine = 0;
    displayWordSpace(config.currentWord.length);
    displayAlert("წარმატებით გასუფთავდა", "success");
    const displayedChars = document.querySelectorAll("li.char");
    displayedChars.forEach((char) => {
      char.removeAttribute("style");
      char.classList.remove("missed");
    });
  }

  function displayAlert(title, icon, text = "", html = "") {
    Swal.fire({ title, icon, text, html });
  }

  function initSpecialChars() {
    if (!config.keys[2].includes(config.chars.delete)) {
      config.keys[2].unshift(config.chars.delete);
    }
  }

  function initGuessedWords() {
    const prevWords = localStorage.getItem(config.storageKeys.guessedWords);
    if (prevWords && Array.isArray(JSON.parse(prevWords))) {
      for (const word of JSON.parse(prevWords)) {
        if (typeof word !== "string") {
          localStorage.removeItem(config.storageKeys.guessedWords);
          return;
        }
      }
      config.prevWords = JSON.parse(prevWords);
    } else {
      localStorage.removeItem(config.storageKeys.guessedWords);
    }
  }

  function getWordList(words = []) {
    return [...new Set(words.map((word) => word.trim()))];
  }

  function initGame() {
    config.stopGame = false;
    config.currentLine = 0;
    config.currentWord = "";
    let randomWord = getRandomWord(config.words);

    while (config.prevWords.includes(randomWord)) {
      randomWord = getRandomWord(config.words);

      if (config.prevWords.length >= config.words.length) {
        displayAlert(
          "სიტყვები დაგვიმთავრდა",
          "warning",
          "თქვენ გამოიცანით ყოველი სიტყვა, ამიერიდან უკვე გამოცნობილ სიტყვებსაც იხილავთ"
        );
        localStorage.removeItem(config.storageKeys.guessedWords);
        config.prevWords = [];
        break;
      }
    }

    config.currentWord = randomWord;
    wordsDisplay.innerHTML = "";
    displayWordSpace(randomWord.length);
  }

  initSpecialChars();
  displayKeyboard(config.keys);
  initGuessedWords();
  initGame();
})();
