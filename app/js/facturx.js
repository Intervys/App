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
  const isAvoir  = doc.doc_type === 'avoir';
  const total    = Math.abs(parseFloat(doc.total    || 0)).toFixed(2);
  const subtotal = Math.abs(parseFloat(doc.subtotal || doc.total || 0)).toFixed(2);

  const lines = items.map((item, i) => {
    const qty   = parseFloat(item.qty   || 1);
    const price = Math.abs(parseFloat(item.price || 0));
    return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i+1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${x(item.desc||item.description||item.label||'Article')}</ram:Name>
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
    <ram:BusinessProcessSpecifiedDocumentContextParameter>
      <ram:ID>M1</ram:ID>
    </ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${x(doc.number||'')}</ram:ID>
    <ram:TypeCode>${doc.doc_type === 'avoir' ? '381' : '380'}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issued}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${doc.doc_type !== 'avoir' ? `<ram:IncludedNote>
      <ram:Content>En cas de retard de paiement, des pénalités de retard seront appliquées au taux de 3 fois le taux d'intérêt légal en vigueur, exigibles dès le premier jour de retard (Art. L. 441-10 C. com.).</ram:Content>
      <ram:SubjectCode>PMD</ram:SubjectCode>
    </ram:IncludedNote>
    <ram:IncludedNote>
      <ram:Content>Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40,00 EUR (Art. L. 441-10 C. com.).</ram:Content>
      <ram:SubjectCode>PMT</ram:SubjectCode>
    </ram:IncludedNote>
    <ram:IncludedNote>
      <ram:Content>Pas d'escompte pour paiement anticipé.</ram:Content>
      <ram:SubjectCode>AAB</ram:SubjectCode>
    </ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${lines}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${x(BUSINESS.legal || BUSINESS.name || BUSINESS.brand)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${(BUSINESS.siret||'').replace(/\s/g,'').slice(0,9)}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          ${BUSINESS.zip ? `<ram:PostcodeCode>${x(BUSINESS.zip)}</ram:PostcodeCode>` : ''}
          <ram:LineOne>${x(BUSINESS.address)}</ram:LineOne>
          <ram:CityName>${x(BUSINESS.city)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication><ram:URIID schemeID="0225">${x(doc._pa_sender_routing || (BUSINESS.siret||'').replace(/\s/g,'').slice(0,9))}</ram:URIID></ram:URIUniversalCommunication>
        ${BUSINESS.tva_num
          ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${x(BUSINESS.tva_num)}</ram:ID></ram:SpecifiedTaxRegistration>`
          : `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${(BUSINESS.siret||'').replace(/\s/g,'').slice(0,9)}</ram:ID></ram:SpecifiedTaxRegistration>`
        }
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        ${doc.client_siret ? `<ram:GlobalID schemeID="0225">${x((doc.client_siret||'').replace(/\s/g,'').slice(0,9))}</ram:GlobalID>` : ''}
        <ram:Name>${x(doc.client_name||'Client')}</ram:Name>
        ${doc.client_siret ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${x((doc.client_siret||'').replace(/\s/g,'').slice(0,9))}</ram:ID></ram:SpecifiedLegalOrganization>` : ''}
        <ram:PostalTradeAddress>
          <ram:CountryID>${x(doc.client_country||'FR')}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${doc.client_siret
          ? `<ram:URIUniversalCommunication><ram:URIID schemeID="0225">${x(doc._pa_buyer_routing || (doc.client_siret||'').replace(/\s/g,'').slice(0,9))}</ram:URIID></ram:URIUniversalCommunication>`
          : (doc.client_email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${x(doc.client_email)}</ram:URIID></ram:URIUniversalCommunication>` : '')}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>0.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:ExemptionReason>Franchise en base - Art. 293B CGI</ram:ExemptionReason>
        <ram:BasisAmount>${subtotal}</ram:BasisAmount>
        <ram:CategoryCode>E</ram:CategoryCode>
        <ram:RateApplicablePercent>0</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${due}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${subtotal}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${subtotal}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">0.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${total}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${total}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
      ${doc.doc_type === 'avoir' && doc.ref_invoice ? `<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>${x(doc.ref_invoice)}</ram:IssuerAssignedID></ram:InvoiceReferencedDocument>` : ''}
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
  // Utiliser l'élément déjà rendu (#doc-preview-area) si disponible — images déjà chargées,
  // CSS vars résolues. Sinon créer un div off-screen VISIBLE (jamais visibility:hidden ni opacity).
  const previewEl = document.getElementById('doc-preview-area');
  let container, needsRemove;
  if (previewEl && previewEl.children.length) {
    container    = previewEl;
    needsRemove  = false;
  } else {
    container   = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:#fff;pointer-events:none';
    container.innerHTML = docPreviewHTML(doc, type);
    document.body.appendChild(container);
    needsRemove = true;
  }
  // Attendre que les images soient chargées — html2canvas rend blanc si elles ne le sont pas
  if (typeof _waitForImages === 'function') await _waitForImages(container);
  await new Promise(r => setTimeout(r, needsRemove ? 200 : 60));

  const pdfBytes = await new Promise((resolve, reject) => {
    html2pdf().set({
      margin: [10,10,10,10],
      image: { type:'jpeg', quality:0.97 },
      html2canvas: { scale:2, useCORS:true, logging:false, backgroundColor:'#ffffff' },
      jsPDF: { unit:'mm', format:'a4', orientation:'portrait' },
    }).from(container).outputPdf('arraybuffer').then(buf => {
      if (needsRemove) try { document.body.removeChild(container); } catch(_) {}
      resolve(buf);
    }).catch(err => {
      if (needsRemove) try { document.body.removeChild(container); } catch(_) {}
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
    pdfDoc.setKeywords(['facture', 'factur-x', 'intervys']);
    pdfDoc.setCreator('Intervys Billing');
    pdfDoc.setProducer('Intervys v1.0 - Factur-X BASIC');

    // Générer et embarquer le XML
    const xmlStr   = generateFacturXml(doc);
    const xmlBytes = new TextEncoder().encode(xmlStr);
    await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
      mimeType:         'application/xml',
      description:      'Factur-X BASIC',
      creationDate:     new Date(),
      modificationDate: new Date(),
      afRelationship:   'Data',
    });

    // XMP metadata requis pour PDF/A-3b (Factur-X compliance)
    try {
      const { PDFName } = window.PDFLib;
      const xmpXml = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>BASIC</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
      const xmpBytes = new TextEncoder().encode(xmpXml);
      const metaStream = pdfDoc.context.stream(
        { Type: PDFName.of('Metadata'), Subtype: PDFName.of('XML') },
        xmpBytes
      );
      pdfDoc.catalog.set(PDFName.of('Metadata'), pdfDoc.context.register(metaStream));
    } catch(_) { /* XMP non critique si pdf-lib ne supporte pas l'API context */ }

    const finalBytes = await pdfDoc.save();
    return { bytes: finalBytes, xml: xmlStr };
  } catch(err) {
    console.error('[FacturX] ERREUR embedding XML :', err?.message || err, err?.stack);
    toast('Erreur Factur-X : ' + (err?.message || err), 'error', 8000);
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
