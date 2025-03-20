// src/api/pokemonApi.ts
export const getPokemonDetails = async (pokemonName: string) => {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);

    if (!response.ok) {
        throw new Error('Pokémon não encontrado');
    }

    return await response.json();
};
