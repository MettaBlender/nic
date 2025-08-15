/**
 * Kontaktformular Block für Benutzeranfragen
 * @icon 📝
 */

import React from 'react';

const ContactFormBlock = ({ content = '', onContentChange, editable = false }) => {
  return (
    <div className="w-full h-full min-h-[160px] bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">Kontakt</h3>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Name"
          className="w-full p-2 border border-gray-300 rounded text-sm"
          disabled={!editable}
        />
        <input
          type="email"
          placeholder="E-Mail"
          className="w-full p-2 border border-gray-300 rounded text-sm"
          disabled={!editable}
        />
        <textarea
          placeholder="Nachricht"
          className="w-full p-2 border border-gray-300 rounded text-sm h-16 resize-none"
          disabled={!editable}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600">
          Senden
        </button>
      </div>
    </div>
  );
};

export default ContactFormBlock;
