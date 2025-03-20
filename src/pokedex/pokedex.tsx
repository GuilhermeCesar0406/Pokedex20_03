// src/pokedex/pokedex.tsx
import React, { useEffect, useState, useRef } from 'react';
import { listPokemons } from '../pokemon/ListPokemons';
import { getPokemonDetails } from '../pokemon/services/getPokemonDetails';
import { PokemonDetail } from '../pokemon/Interfaces/PokemonDetail';
import {
    Box, Card, CardActions, CardContent, CardMedia,
    Container, Grid, Typography, Modal, TextField, CircularProgress, IconButton, Button, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

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

const chipContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '8px',
};

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
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
    paddingBottom: '0px',
    '@media (max-width: 600px)': {
        width: '75%',
        maxWidth: '90%',
    },
    '@media (min-width: 600px)': {
        width: '80%',
        maxWidth: '700px',
    },
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
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '50px',
    backgroundColor: '#FFF',
    padding: '5px 5px',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    width: '90%',
    [theme.breakpoints.up('sm')]: {
        width: '300px',
    },
}));

const StyledH1 = styled(Typography)({
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '3rem',
    color: '#FF4500',
    textShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)',
    transition: 'color 0.3s ease, transform 0.3s ease',
    '&:hover': {
        color: '#FFD700',
        transform: 'scale(1.05)',
    },
});

const GuessIconContainer = styled(IconButton)({
    color: 'white',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});

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
    const totalPokemons = 200;
    const [noResults, setNoResults] = useState(false);
    const observerRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            setSearch(value);
        }, 500);
    };

    const handleClearSearch = () => {
        setSearch('');
    };

    useEffect(() => {
        if (!selectedPokemon) return;
        getPokemonDetails(selectedPokemon.name).then((response) => {
            setSelectedPokemonDetails(response);
            setOpen(true);
        });
    }, [selectedPokemon]);

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
            if (entries[0].isIntersecting && !loading && pokemons.length < totalPokemons) {
                loadMorePokemons();
            }
        });

        observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [loading, pokemons]);

    const filteredPokemons = search.length
        ? allPokemons.filter((pokemon) => pokemon.name.toLowerCase().includes(search.toLowerCase()))
        : pokemons;

    const isSearching = search.length > 0;
    const isEmpty = filteredPokemons.length === 0 && !loading && !isSearching;
    const hasResults = filteredPokemons.length > 0;

    useEffect(() => {
        loadMorePokemons();
    }, []);

    const handleModalClose = () => {
        setSelectedPokemon(undefined);
        setOpen(false);
    };

    useEffect(() => {
        if (!isSearching) {
            setNoResults(false);
        } else if (filteredPokemons.length === 0) {
            setNoResults(true);
        }
    }, [filteredPokemons, isSearching]);

    const goToGuessingGame = () => {
        navigate('/guess');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(circle, #ffcc00, #ff4500)', padding: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <StyledH1 variant="h1">Pokédex</StyledH1>
                <IconButton onClick={goToGuessingGame} aria-label="Adivinhar Pokémon" sx={{ color: 'white' }}>
                    <QuestionMarkIcon sx={{ fontSize: '2.5rem' }} /> {/* Você pode substituir por outro ícone aqui */}
                </IconButton>
            </Box>

            <Container maxWidth="lg" sx={{ marginTop: '80px' }}>
                <Grid container spacing={3}>
                    {noResults && (
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: '#FFF', textAlign: 'center', marginTop: '20px' }}>
                                Pokémon não encontrado
                            </Typography>
                        </Grid>
                    )}

                    {hasResults && filteredPokemons.map((pokemon: Pokemon) => {
                        const pokemonId = pokemon.url.split("/")[6];
                        const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;

                        return (
                            <Grid item xs={12} sm={6} md={3} key={pokemon.name}>
                                <StyledCard sx={{ opacity: loading ? 0 : 1, transition: 'opacity 0.3s' }}>
                                    <CardMedia component="img" image={imageUrl} alt={pokemon.name} sx={{ margin: '10px 0' }} />
                                    <CardContent>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                            {capitalizeFirstLetter(pokemon.name)}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Box sx={{ cursor: 'pointer' }} onClick={() => setSelectedPokemon(pokemon)}>
                                            <Button variant="contained" sx={{ backgroundColor: '#FF4500', '&:hover': { backgroundColor: '#FF6347' } }}>
                                                Ver detalhes
                                            </Button>
                                        </Box>
                                    </CardActions>
                                </StyledCard>
                            </Grid>
                        );
                    })}
                </Grid>

                {loading && (
                    <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
                        <CircularProgress size={40} sx={{ color: 'white' }} />
                    </Box>
                )}

                <div ref={observerRef} style={{ height: '50px', visibility: 'hidden' }} />
            </Container>

            <Modal open={open} onClose={handleModalClose}>
                <Box sx={modalStyle}>
                    <IconButton
                        onClick={handleModalClose}
                        sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            color: '#FF4500',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            boxShadow: 2,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {selectedPokemonDetails ? (
                        <>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', marginBottom: '20px' }}>
                                #{selectedPokemonDetails.id} {capitalizeFirstLetter(selectedPokemonDetails.name)}
                            </Typography>
                            <CardMedia
                                component="img"
                                image={selectedPokemonDetails.sprites?.front_default}
                                alt={selectedPokemonDetails.name}
                                sx={{ width: '150px', margin: 'auto', marginBottom: '20px' }}
                            />
                            <Box sx={detailItemStyle}>
                                <Typography sx={detailHeaderStyle}>Tipos</Typography>
                                <Box>
                                    {selectedPokemonDetails.types.map((type) => (
                                        <Chip key={type.type.name} label={capitalizeFirstLetter(type.type.name)} sx={chipStyle} />
                                    ))}
                                </Box>
                            </Box>
                            <Box sx={detailItemStyle}>
                                <Typography sx={detailHeaderStyle}>Altura</Typography>
                                <Typography>{selectedPokemonDetails.height} m</Typography>
                            </Box>
                            <Box sx={detailItemStyle}>
                                <Typography sx={detailHeaderStyle}>Peso</Typography>
                                <Typography>{selectedPokemonDetails.weight} kg</Typography>
                            </Box>
                            <Box sx={detailItemStyle}>
                                <Typography sx={detailHeaderStyle}>Movimentos</Typography>
                                <Box sx={chipContainerStyle}>
                                    {selectedPokemonDetails.moves.slice(0, 5).map((move) => (
                                        <Chip key={move.move.name} label={capitalizeFirstLetter(move.move.name)} sx={chipStyle} />
                                    ))}
                                </Box>
                            </Box>
                            <Box sx={detailItemStyle}>
                                <Typography sx={detailHeaderStyle}>Habilidades</Typography>
                                <Box sx={chipContainerStyle}>
                                    {selectedPokemonDetails.abilities.map((ability) => (
                                        <Chip key={ability.ability.name} label={capitalizeFirstLetter(ability.ability.name)} sx={chipStyle} />
                                    ))}
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Typography variant="h6">Carregando detalhes...</Typography>
                    )}
                </Box>
            </Modal>

            {/* Barra de Pesquisa */}
            <SearchBox>
                <SearchIcon sx={{ color: '#000', marginRight: '8px' }} />
                <TextField
                    variant="standard"
                    placeholder="Buscar Pokémon..."
                    value={search}
                    onChange={handleSearchChange}
                    InputProps={{ disableUnderline: true }}
                    sx={{ input: { color: '#000' }, width: '100%' }}
                />
                {search && (
                    <IconButton onClick={handleClearSearch}>
                        <CloseIcon sx={{ color: '#000' }} />
                    </IconButton>
                )}
            </SearchBox>
        </div>
    );
};

export default Pokedex;