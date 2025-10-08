// lib/utils/generateCorrectionPdf.ts
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generateCorrectionPdf({
  title,
  questions,
  logoUrl,
}: {
  title: string;
  logoUrl: string;
  questions: {
    question: string;
    correctAnswers: string[];
    comment?: string | null;
  }[];
}) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo + title
  if (logoUrl) {
    const img = await fetch(logoUrl).then((res) => res.blob());
    const imgData = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(img);
    });
    doc.addImage(imgData, "PNG", 10, 10, 20, 20);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Med Academy DZ", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(13);
  doc.text(title, pageWidth / 2, 28, { align: "center" });

  let y = 40;
  doc.setFontSize(11);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`Q${i + 1}. ${q.question}`, 10, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.text(`Correct answer(s): ${q.correctAnswers.join(", ") || "—"}`, 12, y);
    y += 6;

    if (q.comment) {
      const split = doc.splitTextToSize(
        "Explanation: " + q.comment.replace(/<[^>]*>/g, ""),
        180
      );
      doc.text(split, 12, y);
      y += split.length * 5 + 4;
    } else {
      y += 4;
    }
  }

  doc.save(`${title.replace(/\s+/g, "_")}_Correction.pdf`);
}
