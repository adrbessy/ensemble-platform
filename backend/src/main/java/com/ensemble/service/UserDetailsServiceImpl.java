package com.ensemble.service;

import com.ensemble.model.User;
import com.ensemble.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    // Méthode appelée automatiquement par Spring pour authentifier un utilisateur
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé avec l'email : " + email));

        // Ici on retourne un objet UserDetails (Spring) basé sur ton utilisateur
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                new ArrayList<>() // liste des rôles / authorities si tu veux en ajouter plus tard
        );
    }
}
