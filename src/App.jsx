import React, { useState } from 'react';
import { pdfjs } from 'react-pdf';
import PDFCanvas from './components/PDFCanvas';
import Sidebar from './components/Sidebar';

// Worker setup for Create-React-App / Vite
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function App() {
    // State for dropped fields
    // Each field: { id, type, x, y, width, height, pageIndex }
    // Coordinates (x, y) are in percentages % relative to the PDF Page container to ensure responsiveness.
    const [fields, setFields] = useState([]);

    // Mock PDF ID handling (would be from backend in real app)
    const [pdfUrl] = useState('/sample.pdf');

    /* Field Management Logic */
    const addField = (type, x, y, pageWidth, pageHeight) => {
        const newField = {
            id: Date.now().toString(),
            type,
            x: (x / pageWidth) * 100, // Store as percentage
            y: (y / pageHeight) * 100, // Store as percentage
            width: 20, // Default width %
            height: 5, // Default height %
        };
        setFields([...fields, newField]);
    };

    const updateField = (id, updates) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col relative">
                <header className="bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm z-10">
                    <h1 className="font-bold text-xl text-gray-800">BoloForms Signature Engine</h1>
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:bg-blue-300"
                        onClick={async () => {
                            try {
                                // Hardcoded sample signature (transparent PNG base64) for prototype reliability
                                const base64data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAYAAAC+jCIaAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABiSURBVHgB7c6xCQAgDAVBM50D2X/F1GInCOM1/wDB2U0n0O0+svj95wMWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFlYfKqEAgT5Zg74AAAAASUVORK5CYII=";

                                // 2. Send Payload
                                const payload = {
                                    pdfId: 'sample',
                                    signatureImage: base64data,
                                    fields: fields.map(f => ({
                                        ...f,
                                        pageIndex: 0 // Hardcoded for prototype
                                    }))
                                };

                                const apiResp = await fetch('http://localhost:5000/sign-pdf', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                });

                                const data = await apiResp.json();
                                if (data.status === 'success') {
                                    // Open Signed PDF
                                    const win = window.open();
                                    win.document.write('<iframe src="' + data.signedPdf + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
                                } else {
                                    alert('Error signing PDF: ' + data.message);
                                }
                            } catch (e) {
                                console.error(e);
                                alert('Error preparing signature or connecting to server');
                            }
                        }}
                    >
                        Save & Sign
                    </button>
                </header>

                <main className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
                    {/* The Canvas Area */}
                    <PDFCanvas
                        file={pdfUrl}
                        fields={fields}
                        onAddField={addField}
                        onUpdateField={updateField}
                    />
                </main>
            </div>
        </div>
    );
}

export default App;
