import React, { useEffect } from "react";

const GoogleTranslate = () => {
  useEffect(() => {
    const addGoogleTranslateScript = () => {
      if (!window.google || !window.google.translate) {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src =
          "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);

        window.googleTranslateElementInit = () => {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en", // Default page language
              includedLanguages: "en,es,fr,de,it,ja,zh-CN,te", // Languages available for translation
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE, // Widget layout
              autoDisplay: false, // Prevent automatic display
            },
            "google_translate_element" // ID of the container for the widget
          );
        };
      }
    };

    addGoogleTranslateScript();
  }, []);

  return <div id="google_translate_element" className="w-full h-auto"></div>;
};

export default GoogleTranslate;
