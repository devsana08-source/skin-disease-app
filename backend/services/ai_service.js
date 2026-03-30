const { spawn } = require('child_process');
const path = require('path');

const predictSkinDisease = (imagePath) => {
  return new Promise((resolve, reject) => {
    // Path to our new Python inference script
    const pyScriptPath = path.join(__dirname, '../models/inference.py');
    
    // Spawn the Python process using the py launcher targeting Python 3.10 specifically
    const pythonProcess = spawn('py', ['-3.10', pyScriptPath, imagePath]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('error', (err) => {
      // In case 'python' itself fails to execute (because it's not installed or not in PATH)
      return reject(new Error('Python is not installed or could not be found via command line.'));
    });

    pythonProcess.on('close', (code) => {
      // Find JSON block in outputData to prevent parse errors from stray prints
      const jsonMatch = outputData.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         try {
           const result = JSON.parse(jsonMatch[0]);
           if (result.error) return reject(new Error(result.error));
           if (code === 0) return resolve(result);
         } catch(e) {}
      }

      // If python crashed for another reason (e.g. missing Pip dependency leading to Traceback)
      if (code !== 0) {
        console.error('Python Script Failed. Exit Code:', code);
        console.error('Raw Stderr:', errorData);
        
        // Grab the last informative error line from the traceback
        const errorLines = errorData.trim().split('\n').filter(line => line.trim() !== '');
        
        // Skip over common TensorFlow warnings about GPU
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
      reject(new Error("ML Inference timed out (took over 90 seconds). The AI model load is taking too long on your CPU - please try again."));
    }, 90000);
    
    // Clear timeout on close
    pythonProcess.on('close', () => clearTimeout(timeout));
  });
};

module.exports = {
  predictSkinDisease
};
