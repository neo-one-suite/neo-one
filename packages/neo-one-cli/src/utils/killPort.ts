import execa from 'execa';
import { killProcess } from './killProcess';

export const killPort = async (port: number, method = 'TCP') => {
  if (process.platform === 'win32') {
    await execa(
      `Stop-Process -Id (Get-Net${method === 'UDP' ? 'UDP' : 'TCP'}Connection -LocalPort ${port}).OwningProcess -Force`,
      [],
      { shell: true },
    );
  } else {
    const { stdout } = await execa('lsof', ['-i', `${method === 'udp' ? 'udp' : 'tcp'}:${port}`]);
    const line = stdout.split('\n').find((l) => l.includes(method === 'udp' ? 'UDP' : 'LISTEN'));
    if (line !== undefined) {
      const pid = parseInt(line.split(/\s+/)[1], 10);
      await killProcess(pid);
    }
  }
};
