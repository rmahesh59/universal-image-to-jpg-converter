export function AboutPanel() {
  return (
    <section className="card about-panel" aria-labelledby="about-title">
      <div className="about-copy">
        <div className="about-eyebrow">Quick Start</div>
        <h2 id="about-title">Convert large photo folders without cloud tools or command-line steps</h2>
        <p>
          Pick a source folder, choose where the JPG files should go, scan once, then start the batch.
          Your files stay on your computer the whole time.
        </p>
        <div className="about-points">
          <div className="about-point">
            <strong>Best for</strong>
            <span>HEIC-heavy iPhone folders, mixed image libraries, and repeat conversions.</span>
          </div>
          <div className="about-point">
            <strong>What it handles</strong>
            <span>Duplicate checks, progress tracking, and safe JPG output naming.</span>
          </div>
          <div className="about-point">
            <strong>First step</strong>
            <span>Fill in both folder paths, then click <em>Scan Images</em>.</span>
          </div>
        </div>
      </div>
      <div className="about-steps" aria-label="Getting started">
        <div className="about-step">
          <span>1</span>
          <div>
            <strong>Choose your folders</strong>
            <p>Set where your images are now and where the converted JPG files should be saved.</p>
          </div>
        </div>
        <div className="about-step">
          <span>2</span>
          <div>
            <strong>Scan before converting</strong>
            <p>Review the file count and keep only the images you want in this batch.</p>
          </div>
        </div>
        <div className="about-step">
          <span>3</span>
          <div>
            <strong>Start and monitor the job</strong>
            <p>Watch live progress and step in only if the app asks how to handle a duplicate.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
