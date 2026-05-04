export function BlockArtifactFilter() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
      <defs>
        <filter id="blockify">
          <feFlood floodColor="rgba(0,0,0,0.18)" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feMorphology operator="dilate" radius="4" />
          <feComposite in="SourceGraphic" operator="arithmetic" k2="1" k3="0.7" />
        </filter>
      </defs>
    </svg>
  );
}
