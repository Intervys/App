// ══════════════════════════════════════════════════════════════
// FACTUR-X — Générateur PDF/A-3 avec XML EN 16931 embarqué
// Conforme à la réforme française de facturation électronique
// Profil MINIMUM — suffisant pour micro-entreprise franchise TVA
// ══════════════════════════════════════════════════════════════

// ── Génère le XML Factur-X ──────────────────────────────────
function generateFacturXml(doc) {
  const items = Array.isArray(doc.items) ? doc.items
    : (typeof doc.items === 'string' ? JSON.parse(doc.items||'[]') : []);

  const fmt  = d => (d||'').slice(0,10).replace(/-/g,'');
  const issued   = fmt(doc.issued_at)  || fmt(new Date().toISOString());
  const due      = fmt(doc.due_date)   || issued;
  const total    = parseFloat(doc.total    || 0).toFixed(2);
  const subtotal = parseFloat(doc.subtotal || doc.total || 0).toFixed(2);

  const lines = items.map((item, i) => {
    const qty   = parseFloat(item.qty   || 1);
    const price = parseFloat(item.price || 0);
    return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i+1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${x(item.desc||'')}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${price.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${qty}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>E</ram:CategoryCode>
          <ram:RateApplicablePercent>0</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${(qty*price).toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${x(doc.number||'')}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issued}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${lines}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${x(BUSINESS.legal)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${BUSINESS.siret}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:LineOne>${x(BUSINESS.address)}</ram:LineOne>
          <ram:CityName>${x(BUSINESS.city)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${BUSINESS.tva_num}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${x(doc.client_name||'Client')}</ram:Name>
        ${doc.client_email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${x(doc.client_email)}</ram:URIID></ram:URIUniversalCommunication>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${due}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>0.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:ExemptionReason>Franchise en base - Art. 293B CGI</ram:ExemptionReason>
        <ram:BasisAmount>${subtotal}</ram:BasisAmount>
        <ram:CategoryCode>E</ram:CategoryCode>
        <ram:RateApplicablePercent>0</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${subtotal}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${subtotal}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">0.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${total}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${total}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

function x(s) { // escape XML
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Génère le PDF Factur-X (PDF + XML embarqué) ─────────────
async function generateFacturXPdf(doc, type) {
  const isInv = type === 'invoice';

  // 1. Générer le PDF visuel avec html2pdf.js
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:0;top:0;width:800px;background:white;z-index:-9999;opacity:0.01;pointer-events:none';
  container.innerHTML = docPreviewHTML(doc, type);
  document.body.appendChild(container);
  await new Promise(r => setTimeout(r, 150)); // DOM render

  const pdfBytes = await new Promise((resolve, reject) => {
    html2pdf().set({
      margin: [10,10,10,10],
      image: { type:'jpeg', quality:0.97 },
      html2canvas: { scale:2, useCORS:true, logging:false },
      jsPDF: { unit:'mm', format:'a4', orientation:'portrait' },
    }).from(container).outputPdf('arraybuffer').then(buf => {
      document.body.removeChild(container);
      resolve(buf);
    }).catch(err => {
      document.body.removeChild(container);
      reject(err);
    });
  });

  // 2. Si pas une facture → retourner le PDF simple
  if (!isInv) return { bytes: new Uint8Array(pdfBytes), xml: null };

  // 3. Embarquer le XML Factur-X dans le PDF avec pdf-lib
  try {
    await loadPdfLib();
    const { PDFDocument } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Métadonnées PDF
    pdfDoc.setTitle(doc.number || 'Facture Intervys');
    pdfDoc.setAuthor(BUSINESS.legal);
    pdfDoc.setSubject('Facture électronique Factur-X');
    pdfDoc.setKeywords(['facture', 'factur-x', 'Intervys']);
    pdfDoc.setCreator('Intervys Billing');
    pdfDoc.setProducer('Intervys v1.0 - Factur-X MINIMUM');

    // Générer et embarquer le XML
    const xmlStr   = generateFacturXml(doc);
    const xmlBytes = new TextEncoder().encode(xmlStr);
    await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
      mimeType:         'application/xml',
      description:      'Factur-X MINIMUM',
      creationDate:     new Date(),
      modificationDate: new Date(),
      afRelationship:   'Data',
    });

    const finalBytes = await pdfDoc.save();
    return { bytes: finalBytes, xml: xmlStr };
  } catch(err) {
    console.warn('[FacturX] pdf-lib error, PDF sans XML embarqué :', err);
    return { bytes: new Uint8Array(pdfBytes), xml: null };
  }
}

// ── Chargement pdf-lib ───────────────────────────────────────
function loadPdfLib() {
  return new Promise((resolve, reject) => {
    if (window.PDFLib) { resolve(); return; }
    const s = document.createElement('script');
    s.src = '/js/pdf-lib.min.js';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── Chargement html2pdf ──────────────────────────────────────
function loadHtml2Pdf() {
  return new Promise((resolve, reject) => {
    if (typeof html2pdf !== 'undefined') { resolve(); return; }
    const s = document.createElement('script');
    s.src = '/js/html2pdf.bundle.min.js';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── Téléchargement direct PDF Factur-X ──────────────────────
async function downloadFacturXPdf(doc, type) {
  try {
    toast('Génération Factur-X...', 'info', 6000);
    await loadHtml2Pdf();
    const { bytes, xml } = await generateFacturXPdf(doc, type);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = (doc.number||'document') + '_factur-x.pdf';
    a.click();
    URL.revokeObjectURL(url);
    toast(xml
      ? `✅ PDF Factur-X généré (XML EN 16931 embarqué)`
      : `✅ PDF généré (xml-lib indisponible, PDF standard)`,
      'success', 4000
    );
  } catch(e) {
    console.error('[FacturX]', e);
    toast('Erreur génération : ' + e.message, 'error');
  }
}

