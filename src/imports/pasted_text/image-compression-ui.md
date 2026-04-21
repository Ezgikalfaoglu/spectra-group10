Create a modern, clean, academic-yet-professional web application UI for an “Image Compression System” that compares JPEG and JPEG2000 compression methods.

Project context:
This is a browser-based image compression and analysis tool. Users upload an image, choose compression settings, run the process, and compare the original and reconstructed image side by side. The system supports JPEG (DCT-based) and JPEG2000 (DWT-based) compression. It also shows performance metrics such as MSE, PSNR, and Compression Ratio.

Design goal:
Design a complete responsive web UI with a minimal, polished, trustworthy interface. The product should feel like a high-quality technical dashboard for students, researchers, and engineers. Make it visually elegant, simple, and structured. Avoid overly playful styles. Use a modern SaaS-like interface with clear cards, soft shadows, rounded corners, consistent spacing, and strong hierarchy.

Brand/style direction:
- Clean white / very light gray background
- Primary accent: deep blue
- Secondary accent: cyan or teal
- Supporting neutrals: slate gray
- Use subtle gradients only if needed
- Typography should be modern, readable, and technical
- Use a grid-based layout
- Components should feel consistent and realistic
- Keep the design suitable for desktop first, but also show tablet/mobile responsiveness
- Add meaningful icons where useful
- Use realistic data and labels
- Focus on UX clarity

Important product features to reflect in the UI:
- Upload grayscale and color images
- Supported formats: PNG, BMP, TIFF, JPG/JPEG
- Supported resolutions: 512x512 and 1024x1024
- Image type selection: natural, computer-generated, hybrid, fingerprint, biomedical
- Compression method selection: JPEG or JPEG2000
- If JPEG2000 is selected, allow wavelet filter choice: Haar, db2, db4
- Decomposition level selection: 1 to 5
- Quantization type: uniform or scalar
- Quantization step size control
- Processing status / progress feedback
- Output view with original and reconstructed image side by side
- Metrics panel showing MSE, PSNR, Compression Ratio, and optionally Sparsity Ratio
- Compression statistics and readable result summaries
- Ability to adjust parameters and run again
- Error/validation state for unsupported file types

Create the following screens in one consistent design system:

1) Landing / Home Page
- Hero section with title: “JPEG & JPEG2000 Image Compression System”
- Subtitle explaining this is an image compression comparison and analysis tool
- Primary CTA: “Start Compression”
- Secondary CTA: “View Demo”
- Small feature cards:
  - Upload image
  - Choose method
  - Tune parameters
  - Compare results
- Optional section showing supported formats and core metrics

2) Main Compression Dashboard
This is the most important screen.
Layout:
- Left sidebar or left settings panel
- Main content area on the right
Sections:
A. Upload Card
  - Drag & drop upload zone
  - Browse files button
  - Supported file types text
  - Uploaded image preview thumbnail
  - File metadata: name, format, resolution, color mode
B. Compression Settings Card
  - Image Type dropdown
  - Compression Method segmented control: JPEG / JPEG2000
  - If JPEG2000 selected, show:
    - Wavelet Filter dropdown: Haar, db2, db4
    - Decomposition Level stepper or dropdown (1–5)
  - Quantization Type radio buttons: Uniform / Scalar
  - Quantization Step Size slider + numeric input
  - Optional toggle for lossless mode for fingerprint and biomedical images
C. Action Area
  - Primary button: “Run Compression”
  - Secondary button: “Reset Parameters”
  - Optional “Save Result”
D. Processing Status Card
  - Progress bar
  - Current stage labels such as:
    Input Validation
    Preprocessing
    DCT / DWT Transform
    Quantization
    Entropy Coding
    Reconstruction
    Evaluation
  - Show active step visually
E. Results Section
  - Two large image panels side by side:
    Original Image
    Reconstructed Image
  - Zoom icon or inspect action
F. Metrics Panel
  - MSE
  - PSNR (dB)
  - Compression Ratio
  - Sparsity Ratio
  - Show each metric in a stat card with value and small explanatory hint
G. Result Summary
  - Text summary such as:
    “JPEG2000 with db4 at level 3 achieved better visual quality with a PSNR of 34.8 dB and a compression ratio of 11.2:1.”
H. Comparison Chart Area
  - Simple clean chart cards for:
    PSNR
    MSE
    Compression Ratio
  - Optional parameter history / previous runs table

3) Upload Validation / Error State Screen
- Same dashboard structure
- Show an uploaded unsupported file
- Error banner:
  “Unsupported file format. Please upload PNG, BMP, TIFF, JPG, or JPEG.”
- Highlight the upload area with error styling
- Provide retry action
- Keep design polished and realistic

4) Processing / Loading State Screen
- Show the dashboard with disabled controls during processing
- Progress indicator should be prominent
- Show step-by-step pipeline visualization
- Include a reassuring message such as:
  “Processing image compression. This may take a few seconds.”
- Make the experience feel premium, not empty

5) Results Comparison Screen
- A focused screen dedicated to results
- Large side-by-side comparison
- Metrics summary row on top
- Tabs or filter chips to compare:
  - JPEG result
  - JPEG2000 result
  - Previous runs
- Include chart area below
- Include “Try New Settings” and “Export Results” buttons

6) Run History / Experiment Log Screen
- Table of previous compression runs
- Columns:
  Run ID
  Date
  Image Name
  Method
  Wavelet
  Decomposition Level
  Quantization Type
  Step Size
  MSE
  PSNR
  Compression Ratio
- Search and filter controls
- Clean academic dashboard style
- Allow clicking a row to open detailed results

7) Responsive Tablet Version
- Adapt the main dashboard to tablet
- Stack settings and results clearly
- Keep usability high

8) Responsive Mobile Version
- Simplify layout for mobile
- Upload section first
- Settings in accordion cards
- Results and metrics below
- Maintain design consistency

Design system requirements:
- Create reusable components:
  buttons, dropdowns, radio buttons, sliders, stat cards, upload area, tabs, table, chart cards, progress bar, alert banner, image comparison cards
- Use an 8px spacing system
- Use consistent corner radius
- Use clear empty states and hover states
- Maintain accessibility and strong contrast
- Use realistic placeholder values and images
- The UI should look production-ready, not like a wireframe

Content examples to use in the mockup:
- Image name: “landscape_sample.tiff”
- Resolution: “1024 × 1024”
- Color mode: “Grayscale”
- Method: “JPEG2000”
- Wavelet: “db4”
- Decomposition level: “3”
- Quantization: “Scalar”
- Step size: “18”
- MSE: “42.73”
- PSNR: “31.82 dB”
- Compression Ratio: “10.4:1”
- Sparsity Ratio: “78%”

Visual mood:
Think of a mix of:
- scientific image processing dashboard
- modern analytics SaaS
- minimal university research tool
- premium but simple engineering product

Output expectation:
Generate high-fidelity UI screens, not low-fidelity wireframes.
Show polished desktop screens first, then tablet and mobile adaptations.
Ensure all screens belong to the same design system and look like one real product.