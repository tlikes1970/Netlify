/**
 * FlickWord Tile Size Tool
 * Dev tool to adjust tile size in real-time
 */

import { useState, useEffect } from "react";

interface FlickWordTileSizeToolProps {
  isVisible?: boolean;
}

export default function FlickWordTileSizeTool({
  isVisible = false,
}: FlickWordTileSizeToolProps) {
  const [tileSize, setTileSize] = useState(60);
  const [tileGap, setTileGap] = useState(5);

  useEffect(() => {
    // Always update CSS custom properties when values change
    const updateVariables = () => {
      // Try multiple selectors to find the game element
      const gameElement =
        (document.querySelector(".flickword-game") as HTMLElement) ||
        (document.querySelector("[data-fw-root]") as HTMLElement);

      if (gameElement) {
        // Set the CSS variables on the game element
        gameElement.style.setProperty("--fw-tile-size", `${tileSize}px`);
        gameElement.style.setProperty("--fw-tile-gap", `${tileGap}px`);
        
        // Also update any row wrappers that use grid-template-columns
        const rowWrappers = gameElement.querySelectorAll(
          "[data-fw-el='tile-row'], .fw-row"
        );
        rowWrappers.forEach((row) => {
          (row as HTMLElement).style.setProperty(
            "grid-template-columns",
            `repeat(5, ${tileSize}px)`
          );
        });
      }
    };

    updateVariables();
    
    // Also update on a slight delay to catch elements that load later
    const timeout = setTimeout(updateVariables, 100);
    
    return () => clearTimeout(timeout);
  }, [tileSize, tileGap]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "16px",
        borderRadius: "8px",
        zIndex: 10001,
        minWidth: "250px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold" }}>
        🎛️ Tile Size Tool
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Tile Size: {tileSize}px
        </label>
        <input
          type="range"
          min="30"
          max="90"
          value={tileSize}
          onChange={(e) => setTileSize(Number(e.target.value))}
          onInput={(e) => setTileSize(Number((e.target as HTMLInputElement).value))}
          style={{
            width: "100%",
            cursor: "pointer",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#999",
            marginTop: "4px",
          }}
        >
          <span>30px</span>
          <span>90px</span>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Tile Gap: {tileGap}px
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={tileGap}
          onChange={(e) => setTileGap(Number(e.target.value))}
          onInput={(e) => setTileGap(Number((e.target as HTMLInputElement).value))}
          style={{
            width: "100%",
            cursor: "pointer",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#999",
            marginTop: "4px",
          }}
        >
          <span>0px</span>
          <span>10px</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "16px",
        }}
      >
        <button
          onClick={() => {
            setTileSize(60);
            setTileGap(5);
          }}
          style={{
            flex: 1,
            padding: "8px",
            background: "#333",
            color: "white",
            border: "1px solid #555",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Reset
        </button>
        <button
          onClick={() => {
            const gameElement =
              (document.querySelector(".flickword-game") as HTMLElement) ||
              (document.querySelector("[data-fw-root]") as HTMLElement);
            if (gameElement) {
              gameElement.style.removeProperty("--fw-tile-size");
              gameElement.style.removeProperty("--fw-tile-gap");
            }
            setTileSize(60);
            setTileGap(5);
          }}
          style={{
            flex: 1,
            padding: "8px",
            background: "#333",
            color: "white",
            border: "1px solid #555",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          marginTop: "12px",
          padding: "8px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
          fontSize: "11px",
          color: "#ccc",
        }}
      >
        <div>Grid Width: ~{tileSize * 5 + tileGap * 4}px</div>
        <div>Grid Height: ~{tileSize * 6 + tileGap * 5}px</div>
      </div>
    </div>
  );
}

