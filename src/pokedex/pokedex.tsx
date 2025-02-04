import React, { useEffect, useState, useRef } from 'react';
import { listPokemons } from '../pokemon/ListPokemons';
import { getPokemonDetails } from '../pokemon/services/getPokemonDetails';
import { PokemonDetail } from '../pokemon/Interfaces/PokemonDetail';
import {
    Box, Card, CardActions, CardContent, CardMedia,
    Container, Grid, Typography, Modal, TextField, CircularProgress, IconButton, Button, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

interface Pokemon {
    name: string;
    url: string;
}

interface PokemonResponse {
    results: Pokemon[];
}

const capitalizeFirstLetter = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const StyledCard = styled(Card)({
    height: '100%',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
    },
    background: 'linear-gradient(135deg, #FFD700, #FF4500)',
    color: 'white',
    textAlign: 'center',
    marginBottom: '20px',
});

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '700px',
    bgcolor: '#FFF',
    boxShadow: 24,
    borderRadius: 4,
    p: 4,
    textAlign: 'center',
    color: '#000',
    outline: '3px solid black',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: '30px',
};

const detailItemStyle = {
    marginBottom: '10px',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#F4F4F9',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const detailHeaderStyle = {
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: '5px',
};

const chipStyle = {
    marginRight: '5px',
    backgroundColor: '#FF4500',
    color: 'white',
};

const SearchBox = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '10px',
    right: '10px',
    borderRadius: '50px',
    backgroundColor: '#FFF',
    display: 'flex',
    alignItems: 'center',
    padding: '5px 10px',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    [theme.breakpoints.down('sm')]: {
        width: '150px',
        right: '10px',
        padding: '5px',
    },
    [theme.breakpoints.up('md')]: {
        width: '250px',
    },
}));

export const Pokedex: React.FC = () => {
    const [pokemons, setPokemons] = useState<Pokemon[]>([]);
    const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
    const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | undefined>(undefined);
    const [selectedPokemonDetails, setSelectedPokemonDetails] = useState<PokemonDetail | undefined>(undefined);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadedPokemons, setLoadedPokemons] = useState<Set<string>>(new Set());
    const [offset, setOffset] = useState(0);
    const limit = 20;
    const [noResults, setNoResults] = useState(false); // Flag para mostrar "Pokémon não encontrado"
    const observerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!selectedPokemon) return;
        getPokemonDetails(selectedPokemon.name).then((response) => {
            setSelectedPokemonDetails(response);
            setOpen(true);
        });
    }, [selectedPokemon]);

    useEffect(() => {
        const filteredPokemons = allPokemons.filter((pokemon: Pokemon) =>
            pokemon.name.toLowerCase().includes(search.toLowerCase())
        );
        setPokemons(filteredPokemons);
        // Mostrar a mensagem "Pokémon não encontrado" caso não haja resultados após a busca
        if (filteredPokemons.length === 0) {
            setNoResults(true);
        } else {
            setNoResults(false);
        }
    }, [search, allPokemons]);

    const loadMorePokemons = async () => {
        setLoading(true);
        try {
            const response = await listPokemons(offset, limit);
            if (response && response.results) {
                const newPokemons = response.results.filter((pokemon: Pokemon) => !loadedPokemons.has(pokemon.name));
                if (newPokemons.length > 0) {
                    const newLoadedPokemons = new Set(loadedPokemons);
                    newPokemons.forEach((pokemon: Pokemon) => newLoadedPokemons.add(pokemon.name));
                    setLoadedPokemons(newLoadedPokemons);
                    setAllPokemons((prev) => [...prev, ...newPokemons]);
                    setPokemons((prev) => [...prev, ...newPokemons]);
                    setOffset((prev) => prev + limit);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar Pokémons:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!observerRef.current) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loading) {
                loadMorePokemons();
            }
        });

        observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [loading]);

    const isSearching = search.length > 0;
    const isEmpty = pokemons.length === 0 && !loading && !isSearching;
    const hasResults = pokemons.length > 0;

    // Ordena alfabeticamente se for mobile
    const sortedPokemons = [...pokemons].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(circle, #ffcc00, #ff4500)', padding: '20px' }}>
            {/* Título e busca no topo */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Pokédex
                </Typography>
                <SearchBox>
                    <SearchIcon sx={{ color: '#000', marginRight: '8px' }} />
                    <TextField
                        variant="standard"
                        placeholder="Buscar Pokémon..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{ disableUnderline: true }}
                        sx={{ input: { color: '#000' }, width: '100%' }}
                    />
                </SearchBox>
            </Box>

            <Container maxWidth="lg">
                <Grid container spacing={3}>
                    {/* Exibir mensagem de "Pokémon não encontrado" se estiver vazio */}
                    {noResults && (
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: '#FFF', textAlign: 'center', marginTop: '20px' }}>
                                Pokémon não encontrado
                            </Typography>
                        </Grid>
                    )}

                    {/* Exibição dos Pokémons */}
                    {hasResults && sortedPokemons.map((pokemon: Pokemon) => {
                        const pokemonId = pokemon.url.split("/")[6];
                        const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;

                        return (
                            <Grid item xs={12} sm={6} md={3} key={pokemon.name}>
                                <StyledCard>
                                    <CardMedia component="img" image={imageUrl} alt={pokemon.name} sx={{ margin: '10px 0' }} />
                                    <CardContent>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                            {capitalizeFirstLetter(pokemon.name)}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Box sx={{ cursor: 'pointer' }} onClick={() => setSelectedPokemon(pokemon)}>
                                            <Button variant="contained" sx={{ backgroundColor: '#FF4500', color: 'white' }}>
                                                Detalhes
                                            </Button>
                                        </Box>
                                    </CardActions>
                                </StyledCard>
                            </Grid>
                        );
                    })}

                    {/* Mostrar loading spinner quando estiver carregando */}
                    {loading && (
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress color="primary" />
                        </Grid>
                    )}

                    {/* Elemento de observação para carregamento infinito */}
                    <div ref={observerRef}></div>
                </Grid>
            </Container>

            {/* Modal de Detalhes do Pokémon */}
            <Modal open={open} onClose={() => setOpen(false)}>
                <Box sx={modalStyle}>
                    {selectedPokemonDetails && (
                        <>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
                                {capitalizeFirstLetter(selectedPokemonDetails.name)}
                            </Typography>
                            <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selectedPokemonDetails.id}.png`}
                                alt={selectedPokemonDetails.name}
                                style={{ width: '150px', height: '150px', marginBottom: '20px' }}
                            />
                            <Box sx={detailItemStyle}>
                                <Typography sx={detailHeaderStyle}>ID:</Typography>
                                <Typography>{selectedPokemonDetails.id}</Typography>
                            </Box>
                            <Box sx={detailItemStyle}>
                                <Typography sx={detailHeaderStyle}>Altura:</Typography>
                                <Typography>{selectedPokemonDetails.height} dm</Typography>
                            </Box>
                            <Box sx={detailItemStyle}>
                                <Typography sx={detailHeaderStyle}>Peso:</Typography>
                                <Typography>{selectedPokemonDetails.weight} hg</Typography>
                            </Box>
                            <Box sx={detailItemStyle}>
                                <Typography sx={detailHeaderStyle}>Habilidades:</Typography>
                                <Box>
                                    {selectedPokemonDetails.abilities?.map((ability) => (
                                        <Chip key={ability.ability.name} label={capitalizeFirstLetter(ability.ability.name)} sx={chipStyle} />
                                    ))}
                                </Box>
                            </Box>
                            <Button
                                variant="contained"
                                sx={{ backgroundColor: '#FF4500', color: 'white', marginTop: '20px' }}
                                onClick={() => setOpen(false)}
                            >
                                <CloseIcon />
                                Fechar
                            </Button>
                        </>
                    )}
                </Box>
            </Modal>
        </div>
    );
};

export default Pokedex;