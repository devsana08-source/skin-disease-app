const { spawn } = require('child_process');
const path = require('path');

// Try multiple Python commands to find one that works
const PYTHON_COMMANDS = [
  ['py', ['-3.10']],
  ['py', ['-3']],
  ['python', []],
  ['python3', []],
];

const predictSkinDisease = (imagePath) => {
  return new Promise((resolve, reject) => {
    const pyScriptPath = path.join(__dirname, '../models/inference.py');

    let commandIndex = 0;

    const tryNextCommand = () => {
      if (commandIndex >= PYTHON_COMMANDS.length) {
        return reject(new Error('Python is not installed or could not be found. Please install Python 3.8+ and ensure it is in your PATH.'));
      }

      const [cmd, extraArgs] = PYTHON_COMMANDS[commandIndex++];
      const args = [...extraArgs, pyScriptPath, imagePath];

      const pythonProcess = spawn(cmd, args);

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('error', (err) => {
        // This command not found, try next
        tryNextCommand();
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);

        // Find JSON block in outputData
        const jsonMatch = outputData.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const result = JSON.parse(jsonMatch[0]);
            if (result.error) return reject(new Error(result.error));
            if (code === 0) return resolve(result);
          } catch (e) {}
        }

        if (code !== 0) {
          console.error(`Python Script Failed with command '${cmd}'. Exit Code:`, code);
          console.error('Raw Stderr:', errorData);

          const errorLines = errorData.trim().split('\n').filter(line => line.trim() !== '');
          let lastError = 'Check backend terminal for full logs';
          for (let i = errorLines.length - 1; i >= 0; i--) {
            if (!errorLines[i].includes('WARNING:tensorflow')) {
              lastError = errorLines[i];
              break;
            }
          }

          return reject(new Error(`Python Crash [Code ${code}]: ${lastError}`));
        }
      });

      // Timeout protection for ML script
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('ML Inference timed out (took over 90 seconds). The AI model load is taking too long on your CPU - please try again.'));
      }, 90000);
    };

    tryNextCommand();
  });
};

module.exports = {
  predictSkinDisease
};
