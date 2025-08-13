import dynamic from 'next/dynamic';
import fs from 'fs';
import path from 'path';

// Pfad zum Ordner mit den Komponenten
const componentsDir = path.join(process.cwd(), 'src/components/nic/blocks');

// Funktion, um alle Dateien im Ordner auszulesen
async function getComponentFiles() {
  try {
    const files = fs
      .readdirSync(componentsDir)
      .filter((file) => file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts'));

    const components = [];
    for (const file of files) {
      // Dynamischer Import der Datei
      const module = await import(`@/components/nic/blocks/${file}`);

      // Extrahiere alle exportierten Komponenten (default und benannte Exports)
      const exports = Object.entries(module).filter(([_, value]) =>
        typeof value === 'function' && value.prototype?.render === undefined // React-Komponenten filtern
      );

      exports.forEach(([exportName, Component]) => {
        components.push({
          name: Component.name || exportName, // Verwende den tatsächlichen Komponentennamen
          Component: dynamic(() => import(`@/components/nic/blocks/${file}`).then((mod) => mod[exportName]), {
            ssr: true, // Serverseitiges Rendering aktiviert (optional)
          }),
        });
      });
    }
    return components;
  } catch (error) {
    console.error('Fehler beim Lesen des Ordners oder Imports:', error);
    return [];
  }
}

export default async function Components() {
  const components = await getComponentFiles();

  return (
    <>
      <p className="w-full text-center mt-2 text-2xl text-white">All Blocks</p>
      {components.length > 0 ? (
        components.map(({ name, Component }) => (
          <div key={name} className="mb-5 px-4">
            <h2 className="text-lg text-white font-semibold">{name}</h2>
            <Component />
          </div>
        ))
      ) : (
        <p className="text-white text-center">Keine Komponenten gefunden.</p>
      )}
    </>
  );
}