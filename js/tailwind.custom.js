// 定義顏色變數和 class 名稱
const colors = {
  primary: '#f9c78b',
  secondary: '#7e7267',
  'region-taiwan': '#00A0A0',
  'region-hkmo': '#800080',
  'region-neasia': '#4682B4',
  'region-seasia': '#FFA500',
  'region-namerica': '#B22222'
};

const classNames = ['text', 'bg', 'border', 'fill', 'stroke', 'border-l', 'border-r', 'border-t', 'border-b'];

function generateStyles(colors, classNames) {
  let styles = ':root {\n';
  for (const [key, value] of Object.entries(colors)) {
    styles += `  --${key}: ${value};\n`;
  }
  styles += '}\n';

  for (const [key, value] of Object.entries(colors)) {
    classNames.forEach(className => {
      styles += `.${className}-${key} {\n`;
      switch (className) {
        case 'text':
          styles += `color: var(--${key});\n`;
          break;
        case 'bg':
          styles += `background-color: var(--${key});\n`;
          break;
        case 'border':
          styles += `border-color: var(--${key});\n`;
          break;
        case 'fill':
          styles += `fill: var(--${key});\n`;
          break;
        case 'stroke':
          styles += `stroke: var(--${key});\n`;
          break;
        case 'border-l':
          styles += `border-left-color: var(--${key});\n`;
          break;
        case 'border-r':
          styles += `border-right-color: var(--${key});\n`;
          break;
        case 'border-t':
          styles += `border-top-color: var(--${key});\n`;
          break;
        case 'border-b':
          styles += `border-bottom-color: var(--${key});\n`;
          break;
      }
      styles += '}\n';
    });
  }

  return styles;
}

function applyStyles(styles) {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

// 生成並應用樣式
const styles = generateStyles(colors, classNames);
applyStyles(styles);