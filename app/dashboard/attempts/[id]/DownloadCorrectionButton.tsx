"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useCallback } from "react";

interface Answer {
  text: string;
  isCorrect: boolean;
}

interface QCM {
  question: string;
  answers: Answer[];
  comment?: string;
}

interface DownloadCorrectionButtonProps {
  qcms: QCM[];
  label: string;
}

export function DownloadCorrectionButton({
  qcms,
  label,
}: DownloadCorrectionButtonProps) {
  const handleDownload = useCallback(async () => {
    if (typeof window === "undefined" || qcms.length === 0) return;

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      // Generate HTML content
      const html = generatePDFContent(qcms, label);

      // Create a hidden iframe to render the content without Tailwind styles
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDoc) {
        throw new Error("Could not create iframe document");
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      const element = iframeDoc.body;

      html2pdf()
        .set({
          margin: 10,
          filename: `${label.replace(/\s+/g, "_")}_Correction.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            // Prevent html2canvas from parsing the entire document
            windowWidth: iframeDoc.documentElement.scrollWidth,
            windowHeight: iframeDoc.documentElement.scrollHeight,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save()
        .finally(() => {
          // Clean up the iframe
          document.body.removeChild(iframe);
        });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erreur lors du téléchargement du PDF. Veuillez réessayer.");
    }
  }, [qcms, label]);

  const generatePDFContent = (qcms: QCM[], label: string): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Correction ${escapeHtml(label)}</title>
          <style>
            /* Reset all styles to avoid any Tailwind contamination */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: "Arial", "Helvetica", sans-serif;
              background-color: #ffffff !important;
              color: #222222 !important;
              padding: 25px;
              line-height: 1.4;
              font-size: 14px;
            }
            
            .header {
              display: flex;
              align-items: center;
              border-bottom: 3px solid #007bff;
              padding-bottom: 8px;
              margin-bottom: 20px;
            }
            
            .header img {
              width: 55px;
              height: 55px;
              margin-right: 10px;
              object-fit: contain;
            }
            
            .title {
              color: #007bff !important;
              font-size: 20px;
              margin: 0;
              font-weight: bold;
            }
            
            .subtitle {
              color: #555555 !important;
              font-size: 13px;
              margin: 0;
            }
            
            .section-title {
              text-align: center;
              font-size: 17px;
              color: #111111 !important;
              margin-bottom: 20px;
              font-weight: bold;
            }
            
            .question {
              border: 1px solid #cccccc;
              border-radius: 8px;
              padding: 15px 18px;
              margin-bottom: 18px;
              background-color: #fafafa;
              page-break-inside: avoid;
            }
            
            .question h3 {
              color: #007bff !important;
              font-size: 15px;
              margin: 0 0 8px 0;
              font-weight: bold;
            }
            
            .question p {
              margin: 0 0 12px 0;
              font-size: 14px;
            }
            
            .answers div {
              margin-bottom: 4px;
              font-size: 14px;
            }
            
            .correct {
              color: #198754 !important;
              font-weight: bold;
            }
            
            .explanation {
              margin-top: 10px;
              padding: 10px 12px;
              border-left: 4px solid #007bff;
              background: #eef6ff;
              border-radius: 6px;
            }
            
            .explanation h4 {
              margin: 0 0 6px 0;
              color: #007bff !important;
              font-size: 14px;
              font-weight: bold;
            }
            
            .correct-answers {
              margin: 8px 0;
              font-size: 14px;
            }
            
            .no-explanation {
              color: #777777 !important;
              font-size: 13px;
              font-style: italic;
              margin: 8px 0 0 0;
            }
            
            footer {
              text-align: center;
              border-top: 1px solid #cccccc;
              margin-top: 25px;
              padding-top: 10px;
              font-size: 12px;
              color: #666666 !important;
            }
            
            /* Print styles */
            @media print {
              body {
                padding: 15px;
              }
              
              .question {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <!-- Using base64 encoded placeholder or external URL to avoid CORS issues -->
            <div style="width: 55px; height: 55px; margin-right: 10px; background: #007bff; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 8px;">
              MA
            </div>
            <div>
              <h1 class="title">Med Academy DZ</h1>
              <p class="subtitle">Correction des QCMs</p>
            </div>
          </div>

          <h2 class="section-title">${escapeHtml(label)}</h2>

          ${qcms
            .map(
              (q, i) => `
            <div class="question">
              <h3>Question ${i + 1} :</h3>
              <p>${escapeHtml(q.question)}</p>
              <div class="answers">
                ${q.answers
                  .map(
                    (a, idx) => `
                  <div>
                    <strong>${String.fromCharCode(65 + idx)}.</strong>
                    <span class="${a.isCorrect ? "correct" : ""}">${escapeHtml(
                      a.text
                    )}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
              <div class="correct-answers">
                <strong class="correct">✓ Réponse(s) correcte(s) :</strong> 
                ${getCorrectAnswersLabel(q.answers)}
              </div>
              ${
                q.comment
                  ? `
                <div class="explanation">
                  <h4>Explication :</h4>
                  <div>${escapeHtml(q.comment)}</div>
                </div>
              `
                  : `<p class="no-explanation">Aucune explication fournie.</p>`
              }
            </div>
          `
            )
            .join("")}

          <footer>
            © ${new Date().getFullYear()} Med Academy DZ — Tous droits réservés.
          </footer>
        </body>
      </html>
    `;
  };

  const getCorrectAnswersLabel = (answers: Answer[]): string => {
    const correctIndices = answers
      .map((answer, index) =>
        answer.isCorrect ? String.fromCharCode(65 + index) : null
      )
      .filter(Boolean);

    return correctIndices.length > 0 ? correctIndices.join(", ") : "—";
  };

  const escapeHtml = (text: string): string => {
    if (typeof document === "undefined") {
      // Fallback for server-side rendering
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  if (qcms.length === 0) {
    return (
      <Button variant="outline" className="flex items-center gap-2" disabled>
        <Download className="h-4 w-4" />
        Aucun QCM à télécharger
      </Button>
    );
  }

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Télécharger le PDF
    </Button>
  );
}
