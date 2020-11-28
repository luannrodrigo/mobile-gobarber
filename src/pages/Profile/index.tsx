import React, { useRef, useCallback } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import ImagePicker from 'react-native-image-picker';

import api from '../../service/api';
import getValidationErrors from '../../utils/getValidationErrors';

import Input from '../../components/Input';
import Button from '../../components/Button';

import { useAuth } from '../../hooks/auth';

import {
  Container,
  Content,
  Title,
  UserAvatarButton,
  UserAvatar,
  BackButton,
} from './styles';

interface ProfileFormData {
  name: string;
  email: string;
  old_password: string;
  password: string;
  password_confirmation: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();

  const formRef = useRef<FormHandles>(null);
  const emailInputRef = useRef<TextInput>(null);
  const oldPasswordInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const passwordConfirmationInputRef = useRef<TextInput>(null);
  const navigation = useNavigation();

  const handleProfile = useCallback(
    async (data: ProfileFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido!'),
          old_password: Yup.string(),
          password: Yup.string().when('old_password', {
            is: val => !!val.length,
            then: Yup.string().required('Campo obrigatório!'),
            otherwise: Yup.string(),
          }),
          password_confirmation: Yup.string()
            .when('old_password', {
              is: val => !!val.length,
              then: Yup.string().required('Campo obrigatório!'),
              otherwise: Yup.string(),
            })
            .oneOf([Yup.ref('password'), null || ''], 'Senhas não conferem'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const {
          name,
          email,
          old_password,
          password,
          password_confirmation,
        } = data;

        const formData = {
          name,
          email,
          ...(old_password
            ? {
                old_password,
                password,
                password_confirmation,
              }
            : {}),
        };
        const response = await api.put('/profile', formData);

        updateUser(response.data);

        Alert.alert('Atualização realizada com sucesso');

        navigation.goBack();
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);

          return;
        }

        Alert.alert('Erro na atualização do perfil');
      }
    },
    [navigation, updateUser],
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleUpdateAvatar = useCallback(() => {
    ImagePicker.showImagePicker(
      {
        title: 'Selecione o avatar',
        cancelButtonTitle: 'Cancelar',
        takePhotoButtonTitle: 'User câmera',
        chooseFromLibraryButtonTitle: 'Escolher da galeria',
      },
      response => {
        if (response.didCancel) {
          return;
        }

        if (response.error) {
          Alert.alert('Erro ao atualizar seu avatar');
        }

        const data = new FormData();
        data.append('avatar', {
          type: 'image/jpeg',
          name: `${user.id}-${new Date().getTime()}.jpg`,
          uri: response.uri,
        });

        api.patch('/users/avatar', data).then(apiResponse => {
          updateUser(apiResponse.data);
        });
      },
    );
  }, [updateUser, user.id]);

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flex: 1 }}
        >
          <Container>
            <Content>
              <BackButton onPress={handleGoBack}>
                <Icon name="chevron-left" size={24} color="#999591" />
              </BackButton>

              <UserAvatarButton onPress={handleUpdateAvatar}>
                <UserAvatar source={{ uri: user.avatar_url }} />
              </UserAvatarButton>
              <View>
                <Title>Meu perfil</Title>
              </View>
              <Form
                initialData={{ name: user.name, email: user.email }}
                ref={formRef}
                onSubmit={handleProfile}
              >
                <Input
                  autoCapitalize="words"
                  name="name"
                  icon="user"
                  placeholder="Nome"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    emailInputRef.current?.focus();
                  }}
                />
                <Input
                  ref={emailInputRef}
                  keyboardType="email-address"
                  autoCorrect={false}
                  autoCapitalize="none"
                  name="email"
                  icon="mail"
                  placeholder="E-mail"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    oldPasswordInputRef.current?.focus();
                  }}
                />
                <Input
                  ref={oldPasswordInputRef}
                  secureTextEntry
                  name="old_password"
                  icon="lock"
                  textContentType="newPassword"
                  placeholder="Senha atual"
                  returnKeyType="next"
                  containerStyle={{ marginTop: 16 }}
                  onSubmitEditing={() => {
                    passwordInputRef.current?.focus();
                  }}
                />

                <Input
                  ref={passwordInputRef}
                  secureTextEntry
                  name="password"
                  icon="lock"
                  textContentType="newPassword"
                  placeholder="Nova senha"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    passwordConfirmationInputRef.current?.focus();
                  }}
                />
                <Input
                  ref={passwordConfirmationInputRef}
                  secureTextEntry
                  name="password_confirmation"
                  icon="lock"
                  textContentType="newPassword"
                  placeholder="Confirmar senha"
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    formRef.current?.submitForm();
                  }}
                />
                <Button
                  onPress={() => {
                    formRef.current?.submitForm();
                  }}
                >
                  Confirmar mudanças
                </Button>
              </Form>
            </Content>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default Profile;
