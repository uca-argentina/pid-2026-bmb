import { NuevoEstacionamiento } from '@app/models';
import { aPayloadEstacionamiento } from './api.mapeo';

const BASE: NuevoEstacionamiento = {
  nombre: 'Cochera Centro',
  direccion: {
    calle: 'Av. Belgrano',
    numero: '1240',
    ciudad: 'CABA',
    provincia: 'Buenos Aires',
    codigoPostal: '',
    latitud: null,
    longitud: null,
  },
  tarifas: { hora: null, estadia: 5000, jornada: null },
  publicado: true,
  horarios: [],
};

describe('aPayloadEstacionamiento', () => {
  it('manda null en las tarifas que no se ofrecen, nunca 0', () => {
    const payload = aPayloadEstacionamiento(BASE);

    expect(payload.tarifa_hora).toBeNull();
    expect(payload.tarifa_estadia).toBe(5000);
    expect(payload.tarifa_jornada).toBeNull();
  });
});
