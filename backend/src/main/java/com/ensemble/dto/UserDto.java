package com.ensemble.dto;

import com.ensemble.model.User;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String photoUrl;
    private LocalDate birthdate;
    private String gender;
    private String photoFilename;
    private String friendCode;

    private Set<SimpleUserDto> contacts;

    public UserDto(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.photoUrl = user.getPhotoUrl();
        this.birthdate = user.getBirthdate();
        this.gender = user.getGender();
        this.photoFilename = user.getPhotoFilename();
        this.friendCode = user.getFriendCode();
        this.contacts = user.getContacts().stream()
                .map(SimpleUserDto::new)
                .collect(Collectors.toSet());
    }
}
