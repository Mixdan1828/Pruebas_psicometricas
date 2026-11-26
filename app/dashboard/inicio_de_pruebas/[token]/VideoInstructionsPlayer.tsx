'use client';

import { useState, useMemo } from 'react';

// 1. Mapeo de videos por prueba (puedes usar rutas locales en /public/videos o URLs de Supabase Storage)
const TEST_VIDEOS_MAP: Record<string, { title: string; url: string }> = {
  'terman': {
    title: 'Instrucciones: Prueba Terman-Merrill',
    url: 'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Prueba%20Terman.mp4',
  },
  'cleaver': {
    title: 'Instrucciones: Prueba Cleaver',
    url: 'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Prueba%20Claver.mp4',
  },
  'raven': {
    title: 'Instrucciones: Test de Raven',
    url: 'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Prueba%20Raven.mp4',
  },
  'NOM-035': {
    title: 'Instrucciones: Prueba NOM-035',
    url: 'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Prueba%20NOM-035.mp4',
  },
  // Agrega aquí el resto de tus pruebas
};

interface AssignedTest {
  test_id: string;
  name: string; // O el identificador que devuelva tu API
}

interface VideoPlayerProps {
  assignedTests: AssignedTest[];
  onCompleteAllVideos: () => void;
}

export function VideoInstructionsPlayer({
  assignedTests,
  onCompleteAllVideos,
}: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 2. Construcción dinámica de la cola de reproducción
  const videoPlaylist = useMemo(() => {
    const queue = [
      {
        id: 'intro',
        title: 'Bienvenida e Instrucciones Generales',
        url: 'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Introduccion%20a%20pruebas.mp4',
      },
    ];

    // Insertar los videos específicos según las pruebas asignadas (evitando duplicados)
    const addedTestKeys = new Set<string>();

    assignedTests.forEach((test) => {
      // Normaliza el nombre o usa test_id según cómo los identifiques
      const key = test.name.toLowerCase().trim(); 
      
      if (TEST_VIDEOS_MAP[key] && !addedTestKeys.has(key)) {
        addedTestKeys.add(key);
        queue.push({
          id: key,
          ...TEST_VIDEOS_MAP[key],
        });
      }
    });

    // Agregar siempre el video de despedida al final
    queue.push({
      id: 'outro',
      title: 'Recomendaciones Finales antes de comenzar',
      url: 'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Despedida.mp4',
    });

    return queue;
  }, [assignedTests]);

  const currentVideo = videoPlaylist[currentIndex];
  const isLastVideo = currentIndex === videoPlaylist.length - 1;

  // 3. Avanzar automáticamente cuando termina el video actual
  const handleVideoEnded = () => {
    if (!isLastVideo) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onCompleteAllVideos();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-xl font-semibold text-gray-800">
          {currentVideo.title}
        </h2>
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Video {currentIndex + 1} de {videoPlaylist.length}
        </span>
      </div>

      {/* El atributo `key` fuerza a React a recargar el tag <video> al cambiar de URL */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          key={currentVideo.url}
          src={currentVideo.url}
          controls
          autoPlay
          playsInline
          onEnded={handleVideoEnded}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        <p className="text-sm text-gray-500">
          El siguiente video comenzará automáticamente al finalizar.
        </p>
        
        {/* Opcional: Botón para saltar o avanzar si ya vio el video */}
        <button
          onClick={handleVideoEnded}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          {isLastVideo ? 'Comenzar Evaluaciones' : 'Siguiente Video →'}
        </button>
      </div>
    </div>
  );
}