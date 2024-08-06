import React from 'react';

const ChatBotIcon = () => {
  return (
    <svg width="34" height="34" viewBox="0 0 38 38">
      <defs>
        <style>
          {`
            .st0{fill:#A30000;}
            .eye {
              -webkit-transform-origin: 50%;
              -webkit-animation: blink 5s infinite;
            }
            @-webkit-keyframes blink {
              0%, 100% {
                  transform: scale(1, .05);
              }
              5%,
              95% {
                  transform: scale(1, 1);
              }
            }
          `}
        </style>
      </defs>
      <path
        className="st0"
        d="M22.2,8.4h-0.6l0.8-2.9l-0.9-0.3l-0.9,3.1H9.7L8.3,5.3L7.4,5.7l1.2,2.7H7.9c-1.9,0-3.4,1.5-3.4,3.4v12.8
    c0,1.9,1.5,3.4,3.4,3.4h14.3c1.9,0,3.4-1.5,3.4-3.4V11.8C25.5,9.9,24,8.4,22.2,8.4z M24,23.6L24,23.6c0,1.6-1.3,2.9-2.9,2.9H8.9
    c-1.6,0-2.9-1.3-2.9-2.9V12.7c0-1.6,1.3-2.9,2.9-2.9h12.2c1.6,0,2.9,1.3,2.9,2.9V23.6z"
      />
      <circle className="st0 eye" cx="10.5" cy="15.9" r="1.9" />
      <circle className="st0 eye" cx="19.5" cy="15.9" r="1.9" />
      <g>
        <g>
          <path
            className="st0"
            d="M13.9,24.3c-1.9,0-2.1-0.1-2.2-0.2c-0.4-0.2-0.9-0.6-1.6-1.3c-0.3-0.2-0.8-0.7-0.8-0.7s0-0.7,0.2-0.9
        c0.2-0.2,0.8-0.3,0.8-0.3s0.2,0.2,0.4,0.3c0.1,0.1,0.3,0.2,0.4,0.4c0.4,0.4,1,0.9,1.3,1c0.7,0.1,4.5,0,7.9-0.1c0,0,0.4,0,0.4,0.8
        c0,0.5-0.3,0.7-0.3,0.7c-1.7,0-3,0.1-3.9,0.1C15.3,24.3,14.5,24.3,13.9,24.3z M12.2,22.7L12.2,22.7z"
          />
        </g>
      </g>
      <path className="st0" d="M2.3,14.4H3v9H2.3c-1.2,0-2.3-1-2.3-2.3v-4.5C0,15.4,1,14.4,2.3,14.4z" />
      <path className="st0" d="M27.8,14.4c1.2,0,2.3,1,2.3,2.3v4.5c0,1.2-1,2.3-2.3,2.3H27v-9L27.8,14.4L27.8,14.4z" />
      <circle className="st0" cx="7.6" cy="4.5" r="1.6" />
      <circle className="st0" cx="22.4" cy="4.5" r="1.6" />
      <circle className="st0" cx="14" cy="4" r="1.6">
        <animate attributeName="cx" begin="0s" dur="2s" values="9;20;9" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};
export default ChatBotIcon;
