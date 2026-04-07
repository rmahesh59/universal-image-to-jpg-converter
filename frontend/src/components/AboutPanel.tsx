export function AboutPanel() {
  return (
    <section className="card about-panel" aria-labelledby="about-title">
      <div className="about-copy">
        <div className="about-eyebrow">About This App</div>
        <h2 id="about-title">Convert iPhone photos and common image types into JPG files on your own computer</h2>
        <p>
          This app is built for people who want a simple, local way to batch-convert HEIC,
          HEIF, PNG, WEBP, TIFF, BMP, JPG, and JPEG images into JPG files. Your files stay on
          your machine, and the app helps with duplicate checking, progress tracking, and clear results.
        </p>
        <div className="about-points">
          <div className="about-point">
            <strong>Who it is for</strong>
            <span>Anyone who wants an easier option than command lines, cloud converters, or one-file-at-a-time tools.</span>
          </div>
          <div className="about-point">
            <strong>What it helps with</strong>
            <span>Large photo folders, iPhone image cleanup, duplicate-safe output, and repeatable batch conversions.</span>
          </div>
          <div className="about-point">
            <strong>What to do first</strong>
            <span>Enter your source folder, enter your destination folder, scan the folder, review the list, then start conversion.</span>
          </div>
        </div>
      </div>
      <div className="about-steps" aria-label="Getting started">
        <div className="about-step">
          <span>1</span>
          <div>
            <strong>Choose your folders</strong>
            <p>Tell the app where your images are now and where the new JPG files should be saved.</p>
          </div>
        </div>
        <div className="about-step">
          <span>2</span>
          <div>
            <strong>Scan before converting</strong>
            <p>Check the file breakdown and keep only the images you want in this batch.</p>
          </div>
        </div>
        <div className="about-step">
          <span>3</span>
          <div>
            <strong>Start and monitor the job</strong>
            <p>Watch progress live, and if an exact duplicate appears, choose whether to skip it or keep both.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
