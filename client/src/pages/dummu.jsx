    const [loadingTrans, setLoadingTrans] = useState(false);
    const [translations, setTranslations] = useState(null);
    const [text, setText] = useState("");


const [selectedLanguages, setSelectedLanguages] = useState([]);

    const languageOptions = [
        { code: "ml", name: "Malayalam" },
        { code: "ta", name: "Tamil" },
        { code: "kn", name: "Kannada" },
        { code: "te", name: "Telugu" },
        { code: "bn", name: "Bengali" },
        { code: "ar", name: "Arabic" },
        { code: "ru", name: "Russian" },
        { code: "es", name: "Spanish" },
        { code: "fr", name: "French" },
        { code: "de", name: "German" },
        { code: "hi", name: "Hindi" },
        { code: "zh", name: "Chinese" }
    ];

    const handleLanguageChange = (event) => {
        const selected = Array.from(event.target.selectedOptions, (option) => option.value);
        setSelectedLanguages(selected);
    };


        const translateText = async () => {
        if (!text || selectedLanguages.length === 0) return;
        setLoadingTrans(true);
        setError(null);
        setTranslations(null);

        try {
            const response = await axios.post("http://localhost:7000/translate-text", { text, languages: selectedLanguages });
            setTranslations(response.data.translations);
        } catch (error) {
            setError("Error translating text. Please try again.");
        } finally {
            setLoadingTrans(false);
        }
    };