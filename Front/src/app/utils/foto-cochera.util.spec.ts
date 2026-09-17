import { Cochera, EstadoCochera, TipoVehiculo } from '@app/models';
import { fotoDeCochera } from './foto-cochera.util';

function cochera(parcial: Partial<Cochera> = {}): Cochera {
  return {
    id: 'coc-1',
    estacionamientoId: 'est-1',
    identificador: 'A1',
    sector: 'A',
    tipoVehiculo: 'AUTO' as TipoVehiculo,
    cubierta: true,
    estado: 'LIBRE' as EstadoCochera,
    ...parcial,
  };
}

describe('fotoDeCochera', () => {
  it('al aire libre muestra el playon, sin importar tipo ni estado', () => {
    const playon = 'cocheras/descubierta.jpg';

    expect(fotoDeCochera(cochera({ cubierta: false }))).toBe(playon);
    expect(fotoDeCochera(cochera({ cubierta: false, estado: 'OCUPADA' }))).toBe(playon);
    expect(fotoDeCochera(cochera({ cubierta: false, tipoVehiculo: 'CAMIONETA' }))).toBe(playon);
  });

  it('la camioneta cubierta gana sobre el estado', () => {
    const box = 'cocheras/cubierta-camioneta.jpg';

    expect(fotoDeCochera(cochera({ tipoVehiculo: 'CAMIONETA', estado: 'LIBRE' }))).toBe(box);
    expect(fotoDeCochera(cochera({ tipoVehiculo: 'CAMIONETA', estado: 'OCUPADA' }))).toBe(box);
  });

  it('cubierta y libre muestra el box vacio', () => {
    expect(fotoDeCochera(cochera({ estado: 'LIBRE' }))).toBe('cocheras/cubierta-libre.jpg');
  });

  it('cubierta y tomada muestra el garaje con autos', () => {
    const conAutos = 'cocheras/cubierta-ocupada.jpg';

    expect(fotoDeCochera(cochera({ estado: 'OCUPADA' }))).toBe(conAutos);
    expect(fotoDeCochera(cochera({ estado: 'RESERVADA' }))).toBe(conAutos);
    expect(fotoDeCochera(cochera({ estado: 'INACTIVA' }))).toBe(conAutos);
  });

  it('la moto cubierta sigue la regla del estado', () => {
    expect(fotoDeCochera(cochera({ tipoVehiculo: 'MOTO', estado: 'LIBRE' }))).toBe(
      'cocheras/cubierta-libre.jpg',
    );
    expect(fotoDeCochera(cochera({ tipoVehiculo: 'MOTO', estado: 'OCUPADA' }))).toBe(
      'cocheras/cubierta-ocupada.jpg',
    );
  });
});
