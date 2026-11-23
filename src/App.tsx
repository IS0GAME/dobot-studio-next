import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, OctagonAlert, Plus, Download, Code } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { NavigationRail } from './components/NavigationRail';
import { DigitalTwinView } from './components/DigitalTwinView';
import { JogPanel } from './components/JogPanel';
import { WaypointList } from './components/WaypointList';
import { PendantModal } from './components/PendantModal';
import { SkeletonView } from './components/SkeletonView';
import { VirtualDobotSimulator } from './simulator/virtualDobot';
import { MobilePendantServer } from './server/pendantServer';
import { DobotStorage } from './storage/dobotStorage';
import { CartesianCoord, JointCoord, MotionStyle, ToolAction, Waypoint } from './types/robot';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<'teach' | 'draw' | 'script' | 'settings'>('teach');
  const [isPendantOpen, setIsPendantOpen] = useState(false);
  const [mode, setMode] = useState<'QuickTeach' | 'Studio'>('QuickTeach');
  const [projectName, setProjectName] = useState('Pick and Place Demo.dobot.json');
  const [coords, setCoords] = useState<CartesianCoord>({ x: 230.0, y: 0.0, z: -10.0, r: 0.0 });
  const [joints, setJoints] = useState<JointCoord>({ j1: 0.0, j2: 45.0, j3: 35.0, j4: 0.0 });
  const [speedRatio, setSpeedRatio] = useState<number>(80);
  const [accelRatio, setAccelRatio] = useState<number>(60);
  const [motionStyle, setMotionStyle] = useState<MotionStyle>('MOVJ');
  const [selectedToolAction, setSelectedToolAction] = useState<ToolAction>({ type: 'suction_cup', enabled: true });
  const [is3DOffloaded, setIs3DOffloaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWpIndex, setActiveWpIndex] = useState<number | null>(null);

  // Default sample waypoints
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    {
      id: 'wp-1',
      name: 'Pick Position',
      coords: { x: 180.0, y: 20.0, z: -10.0, r: 0.0 },
      motionStyle: 'MOVJ',
      pauseTime: 0.5,
      toolAction: { type: 'suction_cup', enabled: true },
    },
    {
      id: 'wp-2',
      name: 'Transit Up',
      coords: { x: 240.0, y: 0.0, z: 30.0, r: 0.0 },
      motionStyle: 'MOVL',
      pauseTime: 0.0,
      toolAction: { type: 'suction_cup', enabled: true },
    },
    {
      id: 'wp-3',
      name: 'Drop Position',
      coords: { x: 260.0, y: -15.0, z: -10.0, r: 0.0 },
      motionStyle: 'MOVJ',
      pauseTime: 0.3,
      toolAction: { type: 'suction_cup', enabled: false },
    },
  ]);

  const simulatorRef = useRef<VirtualDobotSimulator | null>(null);
  const pendantServerRef = useRef<MobilePendantServer | null>(null);

  // Initialize Simulator and Pendant Server
  useEffect(() => {
    const sim = new VirtualDobotSimulator();
    simulatorRef.current = sim;

    const unsub = sim.subscribe((data) => {
      setCoords(data.coords);
      setJoints(data.joints);
    });

    // In Bun/Node runtime environments (e.g. tests), start embedded pendant server
    if (typeof window === 'undefined' && typeof Bun !== 'undefined') {
      try {
        const server = new MobilePendantServer({ port: 9876, simulator: sim });
        server.start();
        pendantServerRef.current = server;
      } catch (_) {}
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      unsub();
      sim.destroy();
      if (pendantServerRef.current) {
        pendantServerRef.current.stop();
      }
    };
  }, []);

  // Keyboard Shortcuts: Space (Play), Esc (E-Stop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleEmergencyStop();
      } else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        handlePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [waypoints, isPlaying]);

  const handleJog = (axis: string, step: number) => {
    if (!simulatorRef.current) return;
    const current = simulatorRef.current.getCoords();
    const target = { ...current };
    if (axis === 'x') target.x += step;
    else if (axis === 'y') target.y += step;
    else if (axis === 'z') target.z += step;
    else if (axis === 'r') target.r += step;
    simulatorRef.current.moveTo(target, motionStyle, speedRatio);
  };

  const handleAddPoint = () => {
    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: `P${waypoints.length + 1}`,
      coords: { ...coords },
      motionStyle,
      pauseTime: 0.5,
      toolAction: { ...selectedToolAction },
    };
    setWaypoints([...waypoints, newWp]);
    setActiveWpIndex(waypoints.length);
  };

  const handlePlay = async () => {
    if (!simulatorRef.current || waypoints.length === 0) return;
    setIsPlaying(true);
    for (let i = 0; i < waypoints.length; i++) {
      setActiveWpIndex(i);
      await simulatorRef.current.executeWaypoint(waypoints[i], speedRatio);
    }
    setIsPlaying(false);
  };

  const handleEmergencyStop = () => {
    setIsPlaying(false);
    if (simulatorRef.current) {
      simulatorRef.current.moveTo(simulatorRef.current.getCoords(), 'MOVJ', 100);
    }
  };

  const handleExportLegacy = () => {
    const xml = DobotStorage.exportToLegacyPlaybackXml(waypoints);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace('.dobot.json', '')}.playback`;
    a.click();
  };

  const handleExportPython = () => {
    const py = DobotStorage.exportToPython(waypoints);
    const blob = new Blob([py], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dobot_playback_script.py`;
    a.click();
  };

  if (isLoading) {
    return <SkeletonView />;
  }

  return (
    <div className="w-full h-screen flex bg-[#090b10] text-zinc-100 font-sans antialiased overflow-hidden select-none animate-fadeIn">
      {/* PowerToys 48px NavigationRail */}
      <NavigationRail activeTab={activeNav} onTabChange={setActiveNav} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* PowerToys Breadcrumb Header TitleBar */}
        <TitleBar
          mode={mode}
          onModeChange={setMode}
          projectName={projectName}
          isVirtual={true}
          onOpenPendant={() => setIsPendantOpen(true)}
        />

        {/* Content Canvas */}
        <div className="flex-1 flex overflow-hidden p-3 gap-3">
          {/* Central Workspace: 3D Twin Viewport + Motion Sequence List */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* 3D Digital Twin Viewport (Expanded 52% Height) */}
            <div className="h-[52%] min-h-[240px] flex-shrink-0">
              <DigitalTwinView
                coords={coords}
                joints={joints}
                isOffloaded={is3DOffloaded}
                onToggleOffload={() => setIs3DOffloaded(!is3DOffloaded)}
              />
            </div>

            {/* Waypoint Sequence Cards */}
            <WaypointList
              waypoints={waypoints}
              selectedIndex={activeWpIndex}
              onSelect={(idx) => {
                setActiveWpIndex(idx);
                simulatorRef.current?.moveTo(waypoints[idx].coords, 'MOVJ', speedRatio);
              }}
              onDelete={(idx) => setWaypoints(waypoints.filter((_, i) => i !== idx))}
              onMoveUp={(idx) => {
                if (idx === 0) return;
                const copy = [...waypoints];
                const temp = copy[idx - 1];
                copy[idx - 1] = copy[idx];
                copy[idx] = temp;
                setWaypoints(copy);
              }}
              onMoveDown={(idx) => {
                if (idx === waypoints.length - 1) return;
                const copy = [...waypoints];
                const temp = copy[idx + 1];
                copy[idx + 1] = copy[idx];
                copy[idx] = temp;
                setWaypoints(copy);
              }}
              onPauseTimeChange={(idx, time) => {
                const copy = [...waypoints];
                copy[idx].pauseTime = time;
                setWaypoints(copy);
              }}
            />

            {/* Bottom Command Bar (Zero Emojis, Pure Vector Lucide Icons) */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlay}
                  disabled={isPlaying}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold active:scale-95 transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Loader2 size={15} className="animate-spin text-white" />
                  ) : (
                    <Play size={15} className="fill-white" />
                  )}
                  <span>{isPlaying ? 'Running...' : 'Play Sequence'}</span>
                </button>
                <button
                  onClick={handleEmergencyStop}
                  className="px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-red-600/20"
                  title="Emergency Stop (Esc)"
                >
                  <OctagonAlert size={15} />
                  <span>E-STOP</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddPoint}
                  className="px-3.5 py-2 rounded-xl border border-blue-500/50 bg-blue-500/10 text-cyan-300 hover:bg-blue-600 hover:text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add Pose</span>
                </button>
                <button
                  onClick={handleExportLegacy}
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 font-medium transition-all flex items-center gap-1.5"
                  title="Export as Dobot Studio 1.9.4 .playback file"
                >
                  <Download size={13} />
                  <span>.playback</span>
                </button>
                <button
                  onClick={handleExportPython}
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 font-medium transition-all flex items-center gap-1.5"
                  title="Export as standalone Python script"
                >
                  <Code size={13} />
                  <span>.py</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Jog & Kinematic Configuration Panel */}
          <div className="flex flex-col gap-3 flex-shrink-0">
            <JogPanel
              coords={coords}
              joints={joints}
              onJog={handleJog}
              speedRatio={speedRatio}
              accelRatio={accelRatio}
              onSpeedChange={setSpeedRatio}
              onAccelChange={setAccelRatio}
              selectedToolAction={selectedToolAction}
              onToolActionChange={setSelectedToolAction}
              motionStyle={motionStyle}
              onMotionStyleChange={setMotionStyle}
            />
          </div>
        </div>
      </div>

      {/* Wireless Teach Pendant ContentDialog Modal */}
      <PendantModal
        isOpen={isPendantOpen}
        onClose={() => setIsPendantOpen(false)}
      />
    </div>
  );
};
