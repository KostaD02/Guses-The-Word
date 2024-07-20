(function () {
  const keyboardDisplay = document.querySelector(".keyboard");
  const wordsDisplay = document.querySelector(".words-display");
  const modeDisplay = document.querySelector("#mode-display");
  const actionButtons = document.querySelectorAll("button[data-action]");
  const modeButtons = document.querySelectorAll("button[data-mode]");

  const audio = new Audio();

  const config = {
    prevWords: [],
    stopGame: false,
    showingAnswer: false,
    currentLine: 0,
    currentWord: "",
    maxTry: Infinity,
    delayForCharInput: 1000,
    guesses: [],
    chars: {
      delete: "&#8592;",
    },
    keys: [
      ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ"],
      ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ"],
      ["ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ", "შ"],
      ["ჩ", "ჟ", "ღ", "ჭ", "ძ", "თ"],
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
      S: "შ",
      J: "ჟ",
      R: "ღ",
      C: "ჩ",
    },
    words: getWordList(WORD_LIST),
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
          if (config.stopGame) {
            displayAlert(
              "პასუხი უკვე იცი",
              "info",
              "დააჭირე 'თავიდან დაწყებას' ან აირჩიე რომელიმე რეჟიმი"
            );
            break;
          }
          actionClear();
          break;
        }
        case "info": {
          actionInfo();
          break;
        }
        case "start": {
          if (config.showingAnswer) {
            displayToast("დამთავრდეს ჯერ პასუხის ჩვენება", "warning", "orange");
            break;
          }
          initGame();
          break;
        }
        case "show": {
          if (config.stopGame) {
            displayAlert(
              "პასუხი უკვე იცი",
              "info",
              "დააჭირე 'თავიდან დაწყებას' ან აირჩიე რომელიმე რეჟიმი"
            );
            break;
          }
          showAnswer();
          break;
        }
        default: {
          displayAlert("ქმედება ვერ მოიძებნა", "error");
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
        li.setAttribute("role", "button");
        li.setAttribute("aria-label", char);
        li.setAttribute("aria-pressed", "false");
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

    this.setAttribute("aria-pressed", "true");

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
    }

    index = 0;

    if (config.guesses.includes(typedWord)) {
      displayAlert(
        "განმეორება...",
        "warning",
        "",
        `ეს სიტყვა ცადე უკვე არსებულ პარტიაში, ცადე სხვა სიტყვა. <br> თქვენს მიერ აკრეფილი სიტყვები: ${config.guesses.join()}`
      );
      while (currentContainer.children[index]) {
        currentContainer.children[index].textContent = "";
        index++;
      }
      return;
    }

    // ? Since word list is too short game is too hard
    // if (!config.words.includes(typedWord)) {
    //   displayAlert(
    //     "სიტყვა ვერ მოიძებნა",
    //     "warning",
    //     "",
    //     `თქვენს მიერ აკრეფილი სიტყვა ან არ არსებობს ან არ არის მონაცემთა ბაზაში დამატებული, ამიტომ ეს სიტყვა ვერ იქნება პასუხად გამოყენებული. <br> მოძებნილი სიტყვა იყო: <span style="color: orange; font-weight: bold">${typedWord}</span>`
    //   );
    //   while (currentContainer.children[index]) {
    //     currentContainer.children[index].textContent = "";
    //     index++;
    //   }
    //   return;
    // }

    while (currentContainer.children[index]) {
      const currentChar = currentContainer.children[index].textContent;
      index++;
      const currentCharIndexInWord = config.currentWord.search(currentChar);
      const color =
        currentCharIndexInWord === -1
          ? config.colors.missed
          : config.currentWord[index - 1] === currentChar
          ? config.colors.success
          : config.colors.wrongPlace;
      currentContainer.children[index - 1].style.backgroundColor = color;
      const charRef = document.querySelector(
        `li.char[aria-label='${currentChar}']`
      );
      charRef.style.backgroundColor = color;
      if (color === config.colors.missed) {
        charRef.classList.add("missed");
      }
    }

    if (typedWord === config.currentWord) {
      displayAlert("თქვენ გაიმარჯვეთ", "success");
      winAction();
      playWinSound();
      return;
    }

    config.currentLine++;
    config.guesses.push(typedWord);
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
      playLooseSound();
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

  function showAnswer() {
    const tryLeft = config.maxTry - config.currentLine;
    Swal.fire({
      title: "ნამდვილად გსურთ პასუხის ხილვა?",
      text: `დაგრჩათ ${
        Number.isFinite(tryLeft) ? tryLeft : "უსასრულო რაოდენობის"
      } ცდა`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "დიახ მაჩვენე!",
      cancelButtonText: "არა",
    }).then((result) => {
      if (result.isConfirmed) {
        config.showingAnswer = true;
        winAction();
        autoFill()
          .then(playLooseSound)
          .catch((err) => {
            displayAlert("დაფიქსირდა შეცდომა", "error", err.message);
          });
      }
    });
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

  function winAction() {
    config.stopGame = true;
    config.prevWords.push(config.currentWord);
    localStorage.setItem(
      config.storageKeys.guessedWords,
      JSON.stringify(config.prevWords)
    );
  }

  function displayAlert(title, icon, text = "", html = "") {
    Swal.fire({ title, icon, text, html });
  }

  function displayToast(title, icon, color, time = 1500) {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-right",
      iconColor: color,
      customClass: {
        popup: "colored-toast",
      },
      showConfirmButton: false,
      timer: time,
      timerProgressBar: true,
    });
    Toast.fire({
      icon,
      title,
    });
  }

  function initSpecialChars() {
    const lastLine = config.keys.length - 1;
    if (!config.keys[lastLine].includes(config.chars.delete)) {
      config.keys[lastLine].unshift(config.chars.delete);
    }
  }

  function autoFill() {
    return new Promise((resolve, reject) => {
      try {
        const currentContainer = wordsDisplay.children[config.currentLine];
        const curerntWord = config.currentWord;
        let index = 0;
        let interval;
        interval = setInterval(() => {
          if (
            !config.stopGame ||
            config.currentWord.length - 1 === index ||
            curerntWord !== config.currentWord
          ) {
            clearInterval(interval);
            setTimeout(() => {
              if (curerntWord === config.currentWord) {
                displayAlert("ჰმმ", "question", "შემდგომზე გამოიცნობ");
              }
              config.showingAnswer = false;
              resolve();
            }, config.delayForCharInput);
          }
          const char = config.currentWord[index];
          const li = document.querySelector(`li.char[aria-label='${char}']`);
          currentContainer.children[index].textContent = char;
          currentContainer.children[index].style.backgroundColor =
            config.colors.success;
          li.style.backgroundColor = config.colors.success;
          li.setAttribute("aria-pressed", "true");
          index++;
        }, config.delayForCharInput);
      } catch (err) {
        reject(err);
      }
    });
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

  function playWinSound() {
    audio.src = "assets/sounds/win.mp3";
    audio.play();
  }

  function playLooseSound() {
    audio.src = "assets/sounds/loose.mp3";
    audio.play();
  }

  function initGame() {
    config.stopGame = false;
    config.currentLine = 0;
    config.currentWord = "";
    config.showingAnswer = false;
    config.guesses.slice(0);
    const displayedChars = document.querySelectorAll("li.char");
    displayedChars.forEach((char) => {
      char.removeAttribute("style");
      char.classList.remove("missed");
      char.setAttribute("aria-pressed", "false");
    });

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
