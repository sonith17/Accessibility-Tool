import React, { useEffect, useState } from "react";

const GoogleTranslate = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const addGoogleTranslateScript = () => {
      // Check if the Google Translate script is already loaded
      if (!window.google || !window.google.translate) {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src =
          "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

        // Set the scriptLoaded state to true once the script has loaded successfully
        script.onload = () => setScriptLoaded(true);

        // Handle script load error
        script.onerror = (error) => {
          console.error("Failed to load Google Translate script:", error);
        };

        document.body.appendChild(script);
      } else {
        setScriptLoaded(true); // If the script is already loaded, set the state to true
      }
    };

    addGoogleTranslateScript();

    return () => {
      // Cleanup function if needed (you can remove the script from the DOM if you want)
    };
  }, []);

  useEffect(() => {
    // Ensure that the Google Translate script is loaded before initializing the TranslateElement
    if (scriptLoaded && window.google && window.google.translate) {
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en", // Default page language
            includedLanguages:
              "hi,te,ta,kn,ml,gu,bn,mr,pa,en", // Languages available for translation
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE, // Widget layout
            autoDisplay: true, // Prevent automatic display of the widget
          },
          "google_translate_element" // ID of the container where the widget will be inserted
        );
      };
    } else {
      console.error("Google Translate API is not available.");
    }
  }, [scriptLoaded]);

  return <div id="google_translate_element" className="w-full h-auto"></div>;
};

export default GoogleTranslate;
