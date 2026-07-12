(function (jsPDFAPI) {
    'use strict';
    var font = 'AAEAAAAwAElFTk... your long base64 string will be here ...AAAAAA=='; // This is a placeholder
    var encoding = 'Identity-H';
    var fontName = 'Cairo';
    var fontStyle = 'normal';

    jsPDFAPI.addFileToVFS('Cairo-Regular.ttf', font);
    jsPDFAPI.addFont('Cairo-Regular.ttf', fontName, fontStyle);
}(window.jspdf.jsPDF.API));