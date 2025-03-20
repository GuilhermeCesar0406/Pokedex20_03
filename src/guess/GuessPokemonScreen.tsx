// src/guess/GuessPokemonScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Typography, Box, Button, CircularProgress, TextField, styled,
  List, ListItem, ListItemText, Modal, Fade, Slide
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface PokemonListItem {
  name: string;
  url: string;
}

interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

interface PokemonData {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    versions: {
      'generation-v': {
        'black-white': {
          animated: {
            front_default: string;
          };
        };
      };
    };
  };
  types: {
    type: {
      name: string;
    };
  }[];
  abilities: {
    ability: {
      name: string;
    };
  }[];
  height: number;
  weight: number;
}

const GuessBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  minHeight: 'calc(100vh - 64px)',
  background: 'radial-gradient(circle, #ffcc00, #ff4500)',
  padding: theme.spacing(4),
  color: 'white',
}));

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  color: 'white',
  fontWeight: 'bold',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)',
}));

const SilhouetteBox = styled(Box)(({ theme }) => ({
  width: '150px',
  height: '150px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  marginBottom: theme.spacing(2),
  border: '2px solid white',
}));

const HintText = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: theme.spacing(1),
  fontStyle: 'italic',
}));

const BlurredPokemonImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '100%',
  filter: 'blur(3px)',
  opacity: 0.8,
  transition: 'filter 0.5s ease-in-out, opacity 0.5s ease-in-out',
});

const PokemonImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '100%',
  filter: 'none',
});

const InputField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  width: '80%',
  maxWidth: '300px',
  '& label': {
    color: 'white',
  },
  '& input': {
    color: 'white',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
}));

const GuessButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#FFD700',
  color: '#333',
  fontWeight: 'bold',
  '&:hover': {
    backgroundColor: '#FFE066',
  },
  marginBottom: theme.spacing(1),
}));

const NextButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#4CAF50',
  color: 'white',
  fontWeight: 'bold',
  '&:hover': {
    backgroundColor: '#66BB6A',
  },
  marginTop: theme.spacing(2),
}));

const BackButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  color: 'rgba(255, 255, 255, 0.8)',
  '&:hover': {
    color: 'white',
  },
}));

const ErrorText = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: theme.spacing(1),
}));

const SuccessText = styled(Typography)(({ theme }) => ({
  color: theme.palette.success.main,
  marginTop: theme.spacing(1),
}));

const GuessCount = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: theme.spacing(1),
}));

const PokemonInfoList = styled(List)(({ theme }) => ({
  width: '80%',
  maxWidth: '400px',
  marginTop: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
}));

const InfoListItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const InfoListItemText = styled(ListItemText)({
  color: 'white',
});

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ModalContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 350,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  border: `4px solid ${theme.palette.secondary.main}`,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[20],
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const AnimatedPokemonImage = styled('img')(({ theme }) => ({
  maxWidth: '80%',
  maxHeight: '200px',
  marginBottom: theme.spacing(2),
}));

const CloseButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  color: theme.palette.primary.contrastText,
}));

const NextPokemonButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  fontWeight: 'bold',
  '&:hover': {
    backgroundColor: theme.palette.secondary.dark,
  },
  marginTop: theme.spacing(2),
}));

const GuessPokemonScreen: React.FC = () => {
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [guess, setGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  const pokeApiUrl = 'https://pokeapi.co/api/v2';
  const [hints, setHints] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [animatedSprite, setAnimatedSprite] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    fetchRandomPokemon();
  }, []);

  const fetchRandomPokemon = async () => {
    setLoading(true);
    setIsCorrect(null);
    setGuess('');
    setHints([]);
    setOpenModal(false);
    setAnimatedSprite(null);
    setShowErrorModal(false);
    try {
      const listResponse = await fetch

        (`${pokeApiUrl}/pokemon?limit=1000`);
      if (!listResponse.ok) throw new Error(`Erro ao buscar lista de Pokémon: ${listResponse.status}`);
      const listData: any = await listResponse.json();
      const randomIndex = Math.floor(Math.random() * listData.results.length);
      const randomPokemonName = listData.results[randomIndex].name;

      const detailsResponse = await fetch(`${pokeApiUrl}/pokemon/${randomPokemonName}`);
      if (!detailsResponse.ok) throw new Error(`Erro ao buscar detalhes de ${randomPokemonName}: ${detailsResponse.status}`);
      const detailsData: PokemonData = await detailsResponse.json();
      console.log('Dados recebidos da PokeAPI:', detailsData);
      setPokemon(detailsData);
    } catch (error: any) {
      console.error('Erro ao buscar Pokémon da PokeAPI:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pokemon && attempts < maxAttempts && !isCorrect) {
      generateHints();
    } else {
      setHints([]);
    }
  }, [pokemon, attempts, isCorrect]);

  const generateHints = () => {
    const newHints: string[] = [];
    if (pokemon) {
      if (hints.length < 1 && pokemon.types && pokemon.types.length > 0) {
        newHints.push(`Tipo: ${capitalizeFirstLetter(pokemon.types[0].type.name)}`);
      }
      if (hints.length < 2 && pokemon.abilities && pokemon.abilities.length > 0) {
        newHints.push(`Habilidade: ${capitalizeFirstLetter(pokemon.abilities[0].ability.name)}`);
      }
      if (hints.length < 3) {
        const heightInMeters = pokemon.height / 10;
        newHints.push(`Altura aproximada: ${heightInMeters.toFixed(1)}m`);
      }

      const uniqueHints = [...hints, ...newHints].filter((hint, index, self) =>
        index === self.findIndex((t) => (t === hint))
      );
      setHints(uniqueHints.slice(0, 3));
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(event.target.value.toLowerCase());
    setIsCorrect(null);
  };

  const handleGuessSubmit = () => {
    if (!pokemon || loading) return;
    setAttempts((prevAttempts) => prevAttempts + 1);
    if (guess.trim() === pokemon.name.toLowerCase()) {
      setIsCorrect(true);
      if (pokemon.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default) {
        setAnimatedSprite(pokemon.sprites.versions['generation-v']['black-white'].animated.front_default);
        setOpenModal(true);
      }
    } else {
      setIsCorrect(false);
      if (attempts >= maxAttempts - 1) {
        setShowErrorModal(true);
      }
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    if (isCorrect) {
      handleNextPokemon();
    }
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    handleNextPokemon();
  };

  const handleNextPokemon = () => {
    setAttempts(0);
    fetchRandomPokemon();
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <GuessBox>
      <Title variant="h4">Quem é esse Pokémon?</Title>

      {loading ? (
        <CircularProgress color="primary" />
      ) : pokemon ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SilhouetteBox>
            {!isCorrect && attempts < maxAttempts && pokemon.sprites?.front_default ? (
              <BlurredPokemonImage src={pokemon.sprites.front_default} alt="Silhueta do Pokémon" />
            ) : (
              <PokemonImage src={pokemon.sprites.front_default} alt={pokemon.name} />
            )}
          </SilhouetteBox>

          {hints.map((hint, index) => (
            <HintText key={index}>{hint}</HintText>
          ))}

          <InputField
            label="Seu palpite"
            variant="outlined"
            value={guess}
            onChange={handleInputChange}
            disabled={isCorrect === true || attempts >= maxAttempts || loading}
          />

          <GuessButton
            onClick={handleGuessSubmit}
            disabled={loading || isCorrect === true || attempts >= maxAttempts || !guess.trim()}
          >
            Palpitar
          </GuessButton>

          {isCorrect === true && pokemon && (
            <SuccessText>Você acertou! É {capitalizeFirstLetter(pokemon.name)}!</SuccessText>
          )}

          {isCorrect === false && attempts < maxAttempts && (
            <ErrorText>Incorreto. Tente novamente ({attempts}/{maxAttempts}).</ErrorText>
          )}

          {attempts >= maxAttempts && isCorrect === false && pokemon && (
            <ErrorText>
              Você não acertou. O Pokémon era {capitalizeFirstLetter(pokemon.name)}.
            </ErrorText>
          )}

          <GuessCount>Tentativas: {attempts}/{maxAttempts}</GuessCount>

          {(isCorrect === true || attempts >= maxAttempts) && (
            <NextButton onClick={handleNextPokemon}>Próximo Pokémon</NextButton>
          )}
        </Box>
      ) : (
        <ErrorText>Erro ao carregar o Pokémon.</ErrorText>
      )}

      <BackButton onClick={handleGoBack}>Voltar para a Pokédex</BackButton>

      <StyledModal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Slide direction="up" in={openModal} mountOnEnter unmountOnExit timeout={500}>
          <ModalContent>
            <CloseButton onClick={handleCloseModal}>
              X
            </CloseButton>
            <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2, textAlign: 'center' }}>
              Você acertou!
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
              É {pokemon && capitalizeFirstLetter(pokemon.name)}!
            </Typography>
            {animatedSprite && (
              <AnimatedPokemonImage src={animatedSprite} alt={`Animação de ${pokemon?.name}`} />
            )}
            <NextPokemonButton onClick={handleCloseModal} variant="contained" color="secondary">
              Próximo Pokémon
            </NextPokemonButton>
          </ModalContent>
        </Slide>
      </StyledModal>

      <StyledModal
        open={showErrorModal}
        onClose={handleCloseErrorModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Slide direction="up" in={showErrorModal} mountOnEnter unmountOnExit timeout={500}>
          <ModalContent>
            <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2, textAlign: 'center' }}>
              Você não acertou!
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
              O Pokémon era {pokemon && capitalizeFirstLetter(pokemon.name)}!
            </Typography>
            {pokemon && pokemon.sprites?.front_default && (
              <AnimatedPokemonImage src={pokemon.sprites.front_default} alt={`Imagem de ${pokemon.name}`} />
            )}
            <NextPokemonButton onClick={handleCloseErrorModal} variant="contained" color="secondary">
              Próximo Pokémon
            </NextPokemonButton>
          </ModalContent>
        </Slide>
      </StyledModal>
    </GuessBox>
  );
};

const capitalizeFirstLetter = (name: string) => {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

export default GuessPokemonScreen;  