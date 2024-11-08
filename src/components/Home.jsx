import React, { useState, useEffect, useRef } from "react";
import langConfig from "../config/langConfig.json";
import GoogleTranslate from "./GoogleTranslate";


const Home = () => {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [popupContent, setPopupContent] = useState(""); // State to manage popup content
  const [isPopupVisible, setIsPopupVisible] = useState(false); // State for popup visibility

  const langRef = useRef(language);
  const actionRef = useRef(langConfig[language].actions);
  useEffect(() => {
    langRef.current = language;
    console.log(actionRef.current)
    actionRef.current = langConfig[language].actions;
  }, [language]);

  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.interimResults = false; // Get only final results
  recognition.lang = language; // Set language

  let inactivityTimer;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) {
      fetchContent(url);
    }
  };

  const startListening = () => {
    console.log("Starting recognition in language:", language);
    recognition.start();
    resetInactivityTimer();
  };

  const stopListening = () => {
    console.log("Stopping recognition");
    setIsListening(false);
    recognition.stop();
    clearTimeout(inactivityTimer);
  };

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log("Recognized command:", command);
    handleCommand(command);
    resetInactivityTimer();

    // Restart recognition after a short delay
    setTimeout(() => {
      console.log("Restarting recognition");
      recognition.start(); // Restart recognition to keep listening
    }, 500);
  };

  const handleCommand = (command) => {
    // Get the commands for the current language
    const langCommands = langConfig[language].commands;

    if (langCommands) {
      // Check for scroll down command
      if (langCommands.scroll_down.some((cmd) => command.includes(cmd))) {
        window.scrollBy(0, 100); // Scroll down
      }
      // Check for scroll up command
      else if (langCommands.scroll_up.some((cmd) => command.includes(cmd))) {
        window.scrollBy(0, -100); // Scroll up
      }
    }
  };

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log("Stopping recognition after 30 seconds of inactivity");
      stopListening();
    }, 30000);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const fetchContent = async (url) => {
    try {
      const response = await fetch("http://localhost:5000/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const html = await response.text();
      setContent(html);
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  };

  // Function to send the image source to the backend for description
  const getImageDescription = async (imageUrl) => {
    try {
      const response = await fetch("http://localhost:5000/process-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageUrl }), // Send the image URL as payload
      });
      const data = await response.json();
      await translateParagraph(data.description, langRef.current.slice(0, 2));
    } catch (error) {
      console.error("Error sending image for description:", error);
    }
  };


  const translateParagraph = async (text, targetLanguage) => {
    try {
      const response = await fetch("http://localhost:5000/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, target_lang: targetLanguage }),
      });
      //const translatedText = await response.text();
      console.log("text",text)
      // Show popup after translation
      setPopupContent(text); // Set the content for the popup
      setIsPopupVisible(true); // Show the popup
    } catch (error) {
      console.error("Error translating text:", error);
    }
  };


  // New function to get summary
  const getSummary = async (text) => {
    try {
      const response = await fetch("http://localhost:5000/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      console.log("text to summa ");
      console.log(text);
      console.log("-------------");
      
      const res = await response.text();
      await translateParagraph(
        res,
        'en'
      );
    } catch (error) {
      console.error("Error summarizing text:", error);
    }
  };

  const addButtons = () => {
    // Remove existing buttons, if any
    const existingButtons = document.querySelectorAll("button");
    existingButtons.forEach((btn) => {
      if (!['start', 'stop', 'fetch'].includes(btn.id)) {
        btn.remove();
      }
    });
    

    // Select all relevant text-containing elements (paragraphs)
    const textElements = document.querySelectorAll("#content p");

    textElements.forEach((element) => {
      // Create the speaker button
      const speakerButton = document.createElement("button");
      speakerButton.innerHTML = `🔊 ${actionRef.current[1]}`;
      speakerButton.classList.add(
        "speaker",
        "ml-2",
        "cursor-pointer",
        "text-blue-600",
        "hover:text-blue-800",
        "bg-blue-100",
        "px-3",
        "py-1",
        "rounded",
        "transition",
        "duration-200",
        "ease-in-out"
      );
      speakerButton.onclick = function () {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          var msg = new SpeechSynthesisUtterance();
          msg.text = element.innerText; // Use innerText of the element
          msg.lang = langRef.current; // Set the desired language
          window.speechSynthesis.speak(msg);
        }
      };

      // Create the translate button
      const translateButton = document.createElement("button");
      translateButton.innerHTML = `🌐 ${actionRef.current[2]}`;
      translateButton.classList.add(
        "translate",
        "ml-2",
        "cursor-pointer",
        "text-green-600",
        "hover:text-green-800",
        "bg-green-100",
        "px-3",
        "py-1",
        "rounded",
        "transition",
        "duration-200",
        "ease-in-out"
      );
      translateButton.onclick = async function () {
        await translateParagraph(
          element.innerText,
          langRef.current.slice(0, 2)
        );
      };

      // Adding summary button
      const summaryButton = document.createElement("button");
      summaryButton.innerHTML = `📝  ${actionRef.current[3]}`;
      summaryButton.classList.add(
        "summary",
        "ml-2",
        "cursor-pointer",
        "text-orange-600",
        "hover:text-orange-800",
        "bg-orange-100",
        "px-3",
        "py-1",
        "rounded",
        "transition",
        "duration-200",
        "ease-in-out"
      );
      summaryButton.onclick = async function () {
        // console.log("Getting summary for:", element.innerText);
        await getSummary(element.innerText);
      };

      // Append the buttons after the paragraph element
      element.insertAdjacentElement("afterend", speakerButton);
      element.insertAdjacentElement("afterend", translateButton);
      element.insertAdjacentElement("afterend", summaryButton);

      // Add a class to indicate buttons have been added
      element.classList.add("speaker-added");
    });

    // Select all images inside #content
    const images = document.querySelectorAll("#content img");

    images.forEach((img) => {
      const starButton = document.createElement("button");
      starButton.innerHTML = `⭐ ${actionRef.current[0]}`; // Star button text
      starButton.classList.add(
        "star-button",
        "ml-2",
        "cursor-pointer",
        "text-yellow-500",
        "bg-yellow-100",
        "px-3",
        "py-1",
        "rounded",
        "transition",
        "duration-200",
        "ease-in-out"
      );

      starButton.onclick = function () {
        getImageDescription(img.src); // Call the function to describe the image
      };

      // Append the star button after the image element
      img.insertAdjacentElement("afterend", starButton);

      // Mark the image with a class to prevent duplicate button creation
      img.classList.add("star-added");
    });
  };

  const closePopup = () => {
    setIsPopupVisible(false); // Close the popup
  };



  useEffect(() => {
    if (content) {
      addButtons();
    }
  }, [content, language]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Accezy
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        <div className="flex items-center border-b border-teal-500 py-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
          />
          <button
            id="fetch"
            type="submit"
            className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 text-white font-bold py-1 px-2 rounded"
          >
            Fetch
          </button>
        </div>
        <div className="mt-2 flex items-center justify-center">
        <button
            id="start"
            type="button"
            onClick={startListening}
            className="ml-2 flex-shrink-0 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
          >
            🎤 Start Listening
          </button>
          <button
            id="stop"
            type="button"
            onClick={stopListening}
            className="ml-2 flex-shrink-0 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
          >
            🛑 Stop Listening
          </button>
          </div>
        <div className="flex mt-2 items-center justify-center">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-white border rounded py-2 px-4 mr-2"
          >
            <option value="en-US">English (US)</option>
            <option value="hi-IN">Hindi</option>
            <option value="te-IN">Telugu</option>
            <option value="ta-IN">Tamil</option>
            <option value="kn-IN">Kannada</option>
            <option value="ml-IN">Malayalam</option>
            <option value="gu-IN">Gujarathi</option>
            <option value="bn-IN">Bengali</option>
            <option value="mr-IN">Marathi</option>
            <option value="pa-IN">Punjabi</option>
          </select>
        </div>
      </form>

      <div id="content" className="mt-8 w-full">

        {content &&  <div><GoogleTranslate /><div dangerouslySetInnerHTML={{ __html: content }} /></div>}
      </div>

      {/* Popup for displaying translations or summaries */}
      {isPopupVisible && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg relative mx-4 md:mx-0 md:w-3/4 lg:w-3/4">
            <h2 className="text-lg font-bold">Output</h2>
            <p>{popupContent}</p>
            <button onClick={closePopup} className="mt-4 bg-gray-200 p-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
