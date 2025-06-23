import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const PDFAnalyzer = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [result, setResult] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [loadingTrans, setLoadingTrans] = useState(false);
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("pdf");

  console.log(result);

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
    { code: "zh", name: "Chinese" },
  ];

  const handleLanguageChange = (event) => {
    const selected = Array.from(
      event.target.selectedOptions,
      (option) => option.value
    );
    setSelectedLanguages(selected);
  };

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const analyzePDF = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setEmotion(null);
    setTranslations(null);
    setText("");

    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const [analysisResponse, emotionResponse] = await Promise.all([
        axios.post("http://localhost:5000/predict-pdf", formData),
        axios.post("http://localhost:7000/detect-emotion", formData),
      ]);
      console.log(analysisResponse.data.prediction);

      setResult(analysisResponse.data.prediction);
      setEmotion(emotionResponse.data.emotion);
      setText(emotionResponse.data.text);
    } catch (err) {
      setError("Error analyzing PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setEmotion(null);
    setTranslations(null);

    try {
      const [analysisResponse, emotionResponse] = await Promise.all([
        axios.post("http://localhost:5000/predict", { text }),
        axios.post("http://localhost:7000/detect-emotion/text", { text }),
      ]);
      setResult(analysisResponse.data.prediction);
      setEmotion(emotionResponse.data.emotion);
    } catch (err) {
      setError("Error analyzing text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const translateText = async () => {
    if (!text || selectedLanguages.length === 0) return;
    setLoadingTrans(true);
    setError(null);
    setTranslations(null);

    console.log(text);

    try {
      const response = await axios.post(
        "http://localhost:7000/translate-text",
        {
          text,
          languages: selectedLanguages,
        }
      );
      setTranslations(response.data.translations);
    } catch (error) {
      setError("Error translating text. Please try again.");
    } finally {
      setLoadingTrans(false);
    }
  };

  const resetAll = () => {
    setPdfFile(null);
    setResult(null);
    setEmotion(null);
    setLoading(false);
    setLoadingTrans(false);
    setError(null);
    setTranslations(null);
    setSelectedLanguages([]);
    setText("");
    document.getElementById("pdfInput").value = "";
  };

  const getAnalysisMessage = () => {
    if (!result) return null;
    return result === "Human Generated"
      ? { text: "✅ This document is Human-Generated!", variant: "success" }
      : { text: "🤖 This document is AI-Generated!", variant: "danger" };
  };

  const wordCount = text ? text.trim().split(/\s+/).length : 0;
  const charCount = text ? text.length : 0;
  const analysisMessage = getAnalysisMessage();

  return (
    <div className="container my-5">
      <div className="card shadow-lg p-4 rounded-4 border-0">
        <h2 className="text-center mb-4 fw-bold text-primary">
          📄 PDF & Text Analyzer with Emotion Detection
        </h2>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "pdf" ? "active" : ""}`}
              onClick={() => setActiveTab("pdf")}
              type="button"
            >
              📤 Analyze PDF
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "text" ? "active" : ""}`}
              onClick={() => setActiveTab("text")}
              type="button"
            >
              📝 Analyze Text
            </button>
          </li>
        </ul>

        {/* PDF Tab */}
        {activeTab === "pdf" && (
          <div>
            <div className="mb-3">
              <label className="form-label fw-bold">Select PDF File:</label>
              <input
                type="file"
                id="pdfInput"
                className="form-control"
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </div>
            <div className="d-flex gap-2 mb-4">
              <button
                className="btn btn-outline-primary w-100 fw-bold"
                onClick={analyzePDF}
                disabled={loading || !pdfFile}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Analyzing...
                  </>
                ) : (
                  "🔍 Analyze PDF & Detect Emotion"
                )}
              </button>
              <button
                className="btn btn-outline-secondary fw-bold"
                onClick={resetAll}
              >
                🔁 Reset
              </button>
            </div>
          </div>
        )}

        {/* Text Tab */}
        {activeTab === "text" && (
          <div>
            <div className="mb-3">
              <label className="form-label fw-bold">Enter Text:</label>
              <textarea
                className="form-control"
                rows="5"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your content here..."
              />
            </div>
            <div className="d-flex gap-2 mb-4">
              <button
                className="btn btn-outline-primary w-100 fw-bold"
                onClick={analyzeText}
                disabled={loading || !text.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Analyzing...
                  </>
                ) : (
                  "📚 Analyze Text & Detect Emotion"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Language Selection */}
        <div className="mb-4">
          <label className="form-label fw-bold">🌐 Translate to:</label>
          <select
            className="form-select"
            multiple
            onChange={handleLanguageChange}
          >
            {languageOptions.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline-success mt-3 w-100 fw-bold"
            onClick={translateText}
            disabled={loadingTrans || selectedLanguages.length === 0}
          >
            {loadingTrans ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Translating...
              </>
            ) : (
              "🌍 Translate Text"
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Analysis Result */}
        {result && (
          <div className="alert alert-info text-center">
            <h5 className="fw-bold">📊 Analysis Result:</h5>
            <div
              className={`alert alert-${
                result.includes("Human Generated") ? "success" : "danger"
              } mt-3 fs-5 fw-semibold`}
            >
              {result.includes("Human Generated")
                ? "Human-Generated"
                : "AI-Genrated"}
            </div>
          </div>
        )}

        {/* Emotion */}
        {emotion && (
          <div className="alert alert-warning text-center fw-bold fs-5">
            😄 Detected Emotion: <span className="text-dark">{emotion}</span>
          </div>
        )}

        {/* Original Text */}
        {text && (
          <div className="mt-4">
            <button
              className="btn btn-outline-dark w-100 fw-bold"
              data-bs-toggle="collapse"
              data-bs-target="#originalText"
            >
              📄 Show Extracted Text (Words: {wordCount}, Chars: {charCount})
            </button>
            <div className="collapse mt-3" id="originalText">
              <div className="card card-body bg-light border-0">
                <pre className="m-0" style={{ whiteSpace: "pre-wrap" }}>
                  {text}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Translations */}
        {translations && selectedLanguages.length > 0 && (
          <div className="mt-4 fade show">
            <h5 className="text-success text-center fw-bold">
              🈯 Translations:
            </h5>
            {selectedLanguages.map((langCode) => (
              <div key={langCode} className="bg-light border rounded p-3 my-2">
                <span className="badge bg-primary mb-2">
                  {languageOptions.find((l) => l.code === langCode)?.name}
                </span>
                <p className="mb-0">{translations[langCode]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFAnalyzer;
